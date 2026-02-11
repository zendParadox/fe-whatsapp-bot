/*eslint-disable*/
import { GoogleGenerativeAI } from "@google/generative-ai";

// Support multiple API keys for rotation (comma-separated)
const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const apiKeys = apiKeysString.split(",").map(k => k.trim()).filter(k => k.length > 0);

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
      console.log(`🔄 Rotated to Gemini API key #${currentKeyIndex + 1} of ${apiKeys.length}`);
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

export async function parseTransactionFromText(
  text: string
): Promise<ParsedTransaction[] | null> {
  if (apiKeys.length === 0) {
    console.error("❌ GEMINI_API_KEYS is missing in environment variables!");
    return null;
  }

  // Reset failed keys at start of new request
  resetFailedKeys();

  const prompt = `
    Analyze the following financial text and extract ALL transactions mentioned into a JSON list.
    Text: "${text}"

    Output Schema:
    [
      {
        "amount": number, 
        "type": "INCOME" | "EXPENSE",
        "category": string,
        "description": string,
        "confidence": number
      }
    ]

    Rules:
    - Default to "EXPENSE" if not specified.
    - If it's about receiving money (gaji, dapat, terima), it's "INCOME".
    - Remove "Rp", ".", "," from amount.
    - Translate category to Indonesian.
    - If multiple items are mentioned (e.g. "beli A dan beli B"), return multiple objects in the array.
  `;

  // Try with key rotation on 429 errors
  let attempts = 0;
  const maxAttempts = apiKeys.length;

  while (attempts < maxAttempts) {
    attempts++;
    
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
      console.log(`SENDING PROMPT TO GEMINI (key #${currentKeyIndex + 1})...`, text);
      
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
      const isRateLimited = statusCode === 429 || 
        error?.message?.includes("429") || 
        error?.message?.includes("Too Many Requests") ||
        error?.message?.includes("quota");

      if (isRateLimited) {
        console.warn(`⚠️ Rate limit hit on key #${currentKeyIndex + 1}. Attempting rotation...`);
        
        if (rotateApiKey()) {
          // Wait a bit before retry with new key
          await new Promise(resolve => setTimeout(resolve, 500));
          continue; // Retry with next key
        } else {
          // All keys exhausted
          console.error("❌ All API keys rate limited!");
          throw new Error("GEMINI_RATE_LIMIT");
        }
      }

      // Non-rate-limit error, don't retry
      console.error("❌ Gemini Parse Error Details:", error);
      if (error?.message) console.error("Error Message:", error.message);
      return null;
    }
  }

  console.error("❌ Max retry attempts reached");
  return null;
}
