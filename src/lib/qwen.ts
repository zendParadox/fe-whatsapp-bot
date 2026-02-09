/*eslint-disable*/
/**
 * Qwen AI Integration using OpenAI-compatible API
 * Provider: Alibaba Cloud Model Studio (DashScope)
 */

const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

// Models available: qwen-turbo, qwen-plus, qwen-max
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-flash";

export interface ParsedTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  confidence: number;
}

/**
 * Parse transaction from text using Qwen AI
 */
export async function parseTransactionWithQwen(
  text: string
): Promise<ParsedTransaction[] | null> {
  if (!QWEN_API_KEY) {
    console.error("❌ QWEN_API_KEY is missing in environment variables!");
    return null;
  }

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
    - Return ONLY valid JSON array, no markdown or explanation.
  `;

  try {
    console.log(`📤 SENDING PROMPT TO QWEN (${QWEN_MODEL})...`, text);

    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a financial transaction parser. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Qwen API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("📥 QWEN RAW RESPONSE:", textResponse);

    // Clean and parse JSON
    const jsonStr = textResponse.replace(/```json|```/g, "").trim();
    let parsed = JSON.parse(jsonStr);
    
    // Handle if response is wrapped in an object
    if (parsed.transactions) {
      parsed = parsed.transactions;
    }
    
    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    return parsed as ParsedTransaction[];

  } catch (error: any) {
    console.error("❌ Qwen Parse Error:", error?.message || error);
    return null;
  }
}
