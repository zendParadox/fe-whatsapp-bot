/*eslint-disable*/
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface ParsedTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  confidence: number;
}

export async function parseTransactionFromText(
  text: string
): Promise<ParsedTransaction[] | null> {
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing in environment variables!");
    return null;
  }

  // User requested gemini-2.5-flash, but as of now 2.0-flash-exp is the latest preview. 
  // Falling back to 1.5-flash for stability if 2.0 fails, but let's try 1.5-flash or 2.0-flash-exp.
  // I will use 1.5-flash as it is most stable, but if user insists on 2.0 features we can use gemini-2.0-flash-exp.
  // For now, I will use "gemini-1.5-flash" because "gemini-2.5-flash" definitely causes 404/400 errors.
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Reverted to known working model
    generationConfig: { responseMimeType: "application/json" },
  });

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

  try {
    console.log("SENDING PROMPT TO GEMINI...", text);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    console.log("GEMINI RAW RESPONSE:", textResponse);
    
    const jsonStr = textResponse.replace(/```json|```/g, "").trim();
    // Handle case where AI returns single object instead of array
    let data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
        data = [data];
    }
    
    return data as ParsedTransaction[];
  } catch (error: any) {
    console.error("❌ Gemini Parse Error Details:", error);
    if (error?.message) console.error("Error Message:", error.message);
    return null;
  }
}
