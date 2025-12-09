import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

export interface ParsedTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  confidence: number; // 0-1
}

export async function parseTransactionFromText(
  text: string
): Promise<ParsedTransaction | null> {
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return null;
  }

  const prompt = `
    Analyze the following financial text and extract the transaction details into a JSON object.
    Text: "${text}"

    Output Schema:
    {
      "amount": number, // value in IDR (Indonesian Rupiah). Convert "50k" to 50000.
      "type": "INCOME" | "EXPENSE",
      "category": string, // e.g. "Food", "Transport", "Salary", "Shopping", "Bills". Use capital case.
      "description": string, // brief description
      "confidence": number // 0.0 to 1.0, how confident are you?
    }

    Rules:
    - Default to "EXPENSE" if not specified.
    - If it's about receiving money (gaji, dapat, terima), it's "INCOME".
    - Remove "Rp", ".", "," from amount if present to get a pure number.
    - Translate category to Indonesian if possible or keep common English terms, but be consistent. Common categories: "Makan", "Transportasi", "Belanja", "Tagihan", "Gaji", "Lainnya".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Clean up markdown code blocks if present (though responseMimeType should handle it)
    const jsonStr = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr) as ParsedTransaction;
    
    return data;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
}
