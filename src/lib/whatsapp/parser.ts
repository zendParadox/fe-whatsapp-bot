import { TransactionType, DebtType } from "@prisma/client";

/**
 * Parses a string amount compatible with suffixes.
 * @example "50k" -> 50000
 * @example "1.5jt" -> 1500000
 * @example "50000" -> 50000
 */
export function parseSmartAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const lower = amountStr.toLowerCase();
  let multiplier = 1;

  if (lower.endsWith("k") || lower.endsWith("rb")) {
    multiplier = 1000;
  } else if (lower.endsWith("jt") || lower.endsWith("juta") || lower.endsWith("m")) {
    multiplier = 1000000;
  }

  const cleanNum = parseFloat(lower.replace(/[^\d.,]/g, "").replace(",", "."));
  if (isNaN(cleanNum)) return null;

  return cleanNum * multiplier;
}


/**
 * Parses transaction message with support for multi-word categories and payment methods.
 * Format: keluar 18k beli sabun mandi @kebutuhan pribadi #transfer bca
 * 
 * @example "keluar 50k kopi @minuman" -> { type: EXPENSE, amount: 50000, category: "minuman" }
 * @example "keluar 18k sabun @kebutuhan pribadi #transfer bca" -> { category: "kebutuhan pribadi", paymentMethod: "transfer bca" }
 */
export function parseTransactionMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0].toLowerCase();
  const amount = parseSmartAmount(parts[1]);

  if (amount === null || amount <= 0) return null;

  let type: TransactionType;
  if (["masuk", "income", "in"].includes(command)) {
    type = TransactionType.INCOME;
  } else if (["keluar", "expense", "out"].includes(command)) {
    type = TransactionType.EXPENSE;
  } else {
    return null;
  }

  // Match multi-word category: @kategori sampai # atau akhir string
  // Regex: @(text) sampai sebelum # atau end of line
  const categoryMatch = message.match(/@([^#]+?)(?:\s*#|$)/);
  const category = categoryMatch?.[1]?.trim().toLowerCase() || "lainnya";

  // Match multi-word payment method: #metode bayar sampai akhir string
  const paymentMethodMatch = message.match(/#(.+)$/);
  const paymentMethod = paymentMethodMatch?.[1]?.trim() || null;

  // Extract description: hapus command, amount, @category, dan #payment
  const description = message
    .replace(new RegExp(`^${command}\\s+`, "i"), "") // hapus command
    .replace(new RegExp(`^${parts[1]}\\s*`, "i"), "") // hapus amount
    .replace(/@[^#]+(?=\s*#|$)/, "") // hapus @category (multi-word)
    .replace(/#.+$/, "") // hapus #payment (multi-word)
    .trim() || "Transaksi WhatsApp";

  return { type, amount, description, category, paymentMethod };
}


/**
 * Parses Debt message
 * Format: hutang 50k @Budi beli pulsa
 */
export function parseDebtMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 3) return null; 

  const command = parts[0].toLowerCase();
  const amount = parseSmartAmount(parts[1]);
  
  if (amount === null || amount <= 0) return null;

  let type: DebtType;
  if (command === "hutang") {
      type = DebtType.HUTANG;
  } else if (command === "piutang") {
      type = DebtType.PIUTANG;
  } else {
      return null;
  }

  const personMatch = message.match(/@(\w+)/);
  const personName = personMatch && personMatch[1] ? personMatch[1] : null;

  if (!personName) return null;

  const description = message
      .replace(new RegExp(`^${command}`, "i"), "")
      .replace(parts[1], "")
      .replace(/@\w+/g, "")
      .trim() || "Catatan Hutang";

  return { type, amount, personName, description };
}
