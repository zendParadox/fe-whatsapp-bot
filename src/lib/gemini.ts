/*eslint-disable*/
import { GoogleGenerativeAI } from "@google/generative-ai";

// Support multiple API keys for rotation (comma-separated)
const apiKeysString =
  process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const apiKeys = apiKeysString
  .split(",")
  .map((k) => k.trim())
  .filter((k) => k.length > 0);

// Track which key index to use (in-memory, resets on server restart)
let currentKeyIndex = 0;

// Track failed keys to avoid retrying them in the same request cycle
const failedKeysInCycle = new Set<number>();

export interface ParsedTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  confidence: number;
  wallet?: string; // Nama kantong/dompet, misal: "Cash", "Gopay", "BCA"
}

/**
 * Get a Gemini AI client with the current API key
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  if (apiKeys.length === 0) {
    console.error("❌ No Gemini API keys configured!");
    return null;
  }

  const key = apiKeys[currentKeyIndex];
  return new GoogleGenerativeAI(key);
}

/**
 * Rotate to the next available API key
 * Returns true if successfully rotated, false if all keys exhausted
 */
function rotateApiKey(): boolean {
  failedKeysInCycle.add(currentKeyIndex);

  // Find next available key that hasn't failed in this cycle
  for (let i = 0; i < apiKeys.length; i++) {
    const nextIndex = (currentKeyIndex + 1 + i) % apiKeys.length;
    if (!failedKeysInCycle.has(nextIndex)) {
      currentKeyIndex = nextIndex;
      console.log(
        `🔄 Rotated to Gemini API key #${currentKeyIndex + 1} of ${apiKeys.length}`,
      );
      return true;
    }
  }

  console.error("❌ All Gemini API keys exhausted in this cycle!");
  return false;
}

/**
 * Reset the failed keys tracker (call at start of new request)
 */
function resetFailedKeys(): void {
  failedKeysInCycle.clear();
}

/**
 * Fallback to Cloudflare AI when Gemini is unavailable or rate limited
 */
async function fallbackToCloudflareAI(
  prompt: string,
): Promise<ParsedTransaction[] | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(
        `Cloudflare AI Error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const textResponse = data.result.response;
    console.log("CLOUDFLARE AI RAW RESPONSE:", textResponse);

    // Extract JSON array from text response, as Llama-3 might add surrounding text
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch
      ? jsonMatch[0]
      : textResponse.replace(/```json|```/g, "").trim();

    let parsedData = JSON.parse(jsonStr);
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    return parsedData as ParsedTransaction[];
  } catch (error) {
    console.error("❌ Cloudflare AI Fallback Error:", error);
    return null;
  }
}

export async function parseTransactionFromText(
  text: string,
  categories?: string[],
): Promise<ParsedTransaction[] | null> {
  if (apiKeys.length === 0) {
    console.error("❌ GEMINI_API_KEYS is missing in environment variables!");
    return null;
  }

  // Reset failed keys at start of new request
  resetFailedKeys();

  const prompt = `
    Kamu adalah asisten pencatat keuangan pribadi dan bisnis yang cerdas. Analisis teks berikut dan ekstrak SEMUA transaksi ke dalam bentuk array JSON.
    Teks: "${text}"

    Output Schema:
    [
      {
        "amount": number, 
        "type": "INCOME" | "EXPENSE",
        "category": string,
        "description": string,
        "confidence": number,
        "wallet": string | null
      }
    ]

    Aturan Ketat:
    1. Default ke "EXPENSE" (pengeluaran) jika teks tidak menyebutkan spesifik (misal: "beli makan", "bayar listrik", "bensin").
    2. Jika tentang menerima uang (gaji, dapat arisan, dikasih, menang), maka "INCOME".
    3. Hapus "Rp", ".", dan "," dari nominal. Jadikan integer.
    4. "category" harus dalam Bahasa Indonesia singkat dan relevan (contoh: "Makanan & Minuman", "Transportasi", "Gaji", "Belanja", "Tagihan").
    ${categories && categories.length > 0 ? `PRIORITAS KATEGORI: Kamu SANGAT DISARANKAN untuk menggunakan salah satu kategori dari list berikut jika cocok dengan transaksinya: [${categories.join(", ")}]. Hanya buat kategori baru jika benar-benar tidak ada yang cocok.` : `Jika tidak ada di database, buat kategori baru yang relevan.`}
    5. "description" harus dirapikan, sopan, dengan huruf kapital di awal kata (Title Case). Jangan gunakan singkatan alay. Jangan masukkan nama kantong/dompet ke description.
    6. Jika ada banyak transaksi sekaligus ("beli A 50k lalu bensin 20k"), pecah jadi array beberapa objek!
    7. "wallet" adalah nama kantong/dompet/metode pembayaran yang disebutkan user untuk MASING-MASING transaksi. Contoh: "Cash", "Gopay", "BCA", "Dana", "OVO", "ShopeePay". Jika user menulis "kantong cash" atau "dari gopay" atau "via bca" untuk suatu transaksi, masukkan nama kantongnya. Jika tidak disebutkan, isi null.
  `;

  // Try with key rotation on 429 errors
  let attempts = 0;
  const maxAttempts = apiKeys.length;

  while (attempts < maxAttempts) {
    attempts++;

    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
      console.log(
        `SENDING PROMPT TO GEMINI (key #${currentKeyIndex + 1})...`,
        text,
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      console.log("GEMINI RAW RESPONSE:", textResponse);

      const jsonStr = textResponse.replace(/```json|```/g, "").trim();
      let data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) {
        data = [data];
      }

      return data as ParsedTransaction[];
    } catch (error: any) {
      const statusCode = error?.status || error?.response?.status;
      const isRateLimited =
        statusCode === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("Too Many Requests") ||
        error?.message?.includes("quota");

      const isUnavailable =
        statusCode === 503 ||
        error?.message?.includes("503") ||
        error?.message?.includes("Service Unavailable") ||
        error?.message?.includes("overloaded");

      if (isRateLimited || isUnavailable) {
        console.warn(
          `⚠️ Gemini Error (${statusCode || "limit/unavailable"}) hit on key #${currentKeyIndex + 1}. Attempting rotation...`,
        );

        if (rotateApiKey()) {
          // Wait a bit before retry with new key
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue; // Retry with next key
        } else {
          // All keys exhausted
          console.error("❌ All API keys exhausted or rate limited!");
          break; // Exit loop to trigger fallback
        }
      }

      // Non-rate-limit error, don't retry
      console.error("❌ Gemini Parse Error Details:", error);
      if (error?.message) console.error("Error Message:", error.message);
      break; // Exit loop to trigger fallback
    }
  }

  console.log(
    "🔄 Gemini failed. Falling back to Cloudflare AI (Llama-3-8b-instruct)...",
  );
  const fallbackResult = await fallbackToCloudflareAI(prompt);
  if (fallbackResult) return fallbackResult;

  // Both Gemini and Cloudflare AI failed
  console.error("❌ All AI providers (Gemini + Cloudflare) are down!");
  throw new Error("AI_ALL_PROVIDERS_DOWN");
}

/**
 * Parse transactions from a receipt image using Gemini multimodal
 *
 * @param base64Image - Base64 encoded image data (without data URI prefix)
 * @param mimeType - MIME type of the image (e.g., "image/jpeg", "image/png")
 * @param caption - Optional caption sent with the image
 * @returns Array of parsed transactions or null
 */
export async function parseTransactionFromImage(
  base64Image: string,
  mimeType: string,
  caption?: string,
  categories?: string[],
): Promise<ParsedTransaction[] | null> {
  if (apiKeys.length === 0) {
    console.error("❌ GEMINI_API_KEYS is missing in environment variables!");
    return null;
  }

  resetFailedKeys();

  const captionHint = caption ? `\nUser caption: "${caption}"` : "";

  const prompt = `Kamu adalah asisten pencatat keuangan yang sangat cerdas. Analisis foto struk/nota berikut dan ekstrak SEMUA item transaksi persis sesuai struk.${captionHint}

Output Schema (JSON array):
[
  {
    "amount": number,
    "type": "INCOME" | "EXPENSE",
    "category": string,
    "description": string,
    "confidence": number,
    "wallet": string | null,
  }
]

Aturan Ketat:
1. Setiap item barang/layanan harus menjadi list transaksi yang terpisah.
2. Tipe pastinya "EXPENSE" untuk struk belanja.
3. Nominal "amount" berupa angka bersih tanpa teks, koma, atau titik desimal yang salah.
4. JANGAN masukkan elemen TOTAL, SUB-TOTAL, PAJAK, DISKON, KEMBALIAN, atau CASH sebagai transaksi terpisah!
5. PENTING: Jika di dalam struk terdapat potongan diskon atau tambahan pajak, hitung estimasi harga akhir bersih (net price) dari masing-masing produk (harga setelah dikenakan diskon atau pajak). Nilai "amount" untuk item adalah harga riil aktual yang harus dibayar.
6. Jika struknya buram atau bukan struk belanja, kembalikan array kosong [].
7. "category" gunakan Bahasa Indonesia umum yang elegan (contoh: "Minuman", "Kebutuhan Bulanan", "Makanan", "Elektronik").
${categories && categories.length > 0 ? `PRIORITAS KATEGORI: Kamu SANGAT DISARANKAN untuk memilih kategori dari list ini jika ada yang cocok dengan itemnya: [${categories.join(", ")}]. Hanya buat kategori baru jika terpaksa.` : ``}
8. "description" rapihkan ke format Title Case, jangan tulis singkatan kaku mesin kasir.
9. Jika struknya struk transfer (seperti mutasi bank masuk), buat menjadi "INCOME" jika warna hijau/masuk.
10. "confidence" 0.0 sampai 1.0 seberapa pasti kamu membacanya.
11. "wallet" adalah nama kantong/dompet/metode pembayaran yang disebutkan user untuk MASING-MASING transaksi. Contoh: "Cash", "Gopay", "BCA", "Dana", "OVO", "ShopeePay". Jika user menulis "kantong cash" atau "dari gopay" atau "via bca" untuk suatu transaksi, masukkan nama kantongnya. Jika tidak disebutkan, isi null.
`;

  let attempts = 0;
  const maxAttempts = apiKeys.length;

  while (attempts < maxAttempts) {
    attempts++;

    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
      console.log(
        `📸 SENDING IMAGE TO GEMINI (key #${currentKeyIndex + 1})...`,
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const textResponse = response.text();
      console.log("GEMINI IMAGE RAW RESPONSE:", textResponse);

      const jsonStr = textResponse.replace(/```json|```/g, "").trim();
      let data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) {
        data = [data];
      }

      // Filter out zero-amount or invalid entries
      data = data.filter(
        (tx: ParsedTransaction) => tx.amount > 0 && tx.description,
      );

      return data as ParsedTransaction[];
    } catch (error: any) {
      const statusCode = error?.status || error?.response?.status;
      const isRateLimited =
        statusCode === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("Too Many Requests") ||
        error?.message?.includes("quota");

      if (isRateLimited) {
        console.warn(
          `⚠️ Rate limit hit on key #${currentKeyIndex + 1}. Attempting rotation...`,
        );

        if (rotateApiKey()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        } else {
          console.error("❌ All API keys rate limited!");
          throw new Error("GEMINI_RATE_LIMIT");
        }
      }

      console.error("❌ Gemini Image Parse Error:", error);
      if (error?.message) console.error("Error Message:", error.message);
      return null;
    }
  }

  console.error("❌ Max retry attempts reached for image parsing");
  return null;
}
