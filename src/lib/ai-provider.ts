/**
 * Unified AI Provider - Exclusive Gemini Integration
 * All requests are automatically routed to Google Gemini API
 */

import { parseTransactionFromText as parseWithGemini, parseTransactionFromImage as parseImageWithGemini, type ParsedTransaction } from "./gemini";

/**
 * Parse transaction using Google Gemini API
 * 
 * @param text - The text to parse for transactions
 * @returns Array of parsed transactions or null if parsing failed
 */
export async function parseTransactionWithAI(
  text: string,
  categories?: string[]
): Promise<ParsedTransaction[] | null> {
  console.log(`🤖 Using AI Provider: gemini`);
  return parseWithGemini(text, categories);
}

// Re-export types for convenience
export type { ParsedTransaction };

/**
 * Parse receipt image using Gemini multimodal
 */
export async function parseReceiptImage(
  base64Image: string,
  mimeType: string,
  caption?: string,
  categories?: string[]
): Promise<ParsedTransaction[] | null> {
  console.log(`📸 Parsing receipt image with AI Provider: gemini`);
  return parseImageWithGemini(base64Image, mimeType, caption, categories);
}
