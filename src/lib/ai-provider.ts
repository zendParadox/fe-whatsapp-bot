/*eslint-disable*/
/**
 * Unified AI Provider
 * Supports: gemini, qwen, auto (fallback)
 */

import { parseTransactionFromText as parseWithGemini, type ParsedTransaction } from "./gemini";
import { parseTransactionWithQwen as parseWithQwen } from "./qwen";

// AI Provider options: 'gemini' | 'qwen' | 'auto'
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

/**
 * Parse transaction using configured AI provider
 * 
 * @param text - The text to parse for transactions
 * @returns Array of parsed transactions or null if parsing failed
 */
export async function parseTransactionWithAI(
  text: string
): Promise<ParsedTransaction[] | null> {
  console.log(`🤖 Using AI Provider: ${AI_PROVIDER}`);

  switch (AI_PROVIDER) {
    case "gemini":
      return parseWithGemini(text);

    case "qwen":
      return parseWithQwen(text);

    case "auto":
      // Try Gemini first, fallback to Qwen if it fails
      console.log("🔄 Auto mode: Trying Gemini first...");
      let geminiResult;
      try {
        geminiResult = await parseWithGemini(text);
        if (geminiResult && geminiResult.length > 0) {
          console.log("✅ Gemini succeeded");
          return geminiResult;
        }
      } catch (error: any) {
        if (error.message === "GEMINI_RATE_LIMIT") {
          console.warn("⚠️ Gemini rate limit exceeded in auto mode, falling back to Qwen...");
        } else {
          console.error("❌ Gemini error:", error);
        }
      }
      
      console.log("⚠️ Gemini failed, falling back to Qwen...");
      const qwenResult = await parseWithQwen(text);
      
      if (qwenResult && qwenResult.length > 0) {
        console.log("✅ Qwen fallback succeeded");
        return qwenResult;
      }
      
      console.error("❌ All AI providers failed");
      return null;

    default:
      console.warn(`⚠️ Unknown AI_PROVIDER: ${AI_PROVIDER}, defaulting to Gemini`);
      return parseWithGemini(text);
  }
}

// Re-export types for convenience
export type { ParsedTransaction };
