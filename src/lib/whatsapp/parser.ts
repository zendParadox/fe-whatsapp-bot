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

  // Extract payment method first (the LAST # in the string)
  const lastHashIndex = message.lastIndexOf("#");
  let paymentMethod: string | null = null;
  let messageWithoutPayment = message;
  
  if (lastHashIndex !== -1) {
    paymentMethod = message.substring(lastHashIndex + 1).trim() || null;
    messageWithoutPayment = message.substring(0, lastHashIndex).trim();
  }

  // Extract category (the LAST @ in the string before payment method)
  const lastAtIndex = messageWithoutPayment.lastIndexOf("@");
  let categoryStr = "lainnya";
  let descriptionParts = messageWithoutPayment;

  if (lastAtIndex !== -1) {
    categoryStr = messageWithoutPayment.substring(lastAtIndex + 1).trim() || "lainnya";
    descriptionParts = messageWithoutPayment.substring(0, lastAtIndex).trim();
  }
  
  const category = categoryStr.toLowerCase();

  // Extract description: remove command and amount from the beginning
  const descriptionRegex = new RegExp(`^${command}\\s+${parts[1]}\\s*`, "i");
  const description = descriptionParts.replace(descriptionRegex, "").trim() || "Transaksi WhatsApp";

  return { type, amount, description, category, paymentMethod };
}


/**
 * Parses Debt message
 * Format: hutang 50k @Budi beli pulsa #gopay
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

  // Extract payment method (the LAST # in the string)
  const lastHashIndex = message.lastIndexOf("#");
  let paymentMethod: string | null = null;
  let messageWithoutPayment = message;

  if (lastHashIndex !== -1) {
    paymentMethod = message.substring(lastHashIndex + 1).trim() || null;
    messageWithoutPayment = message.substring(0, lastHashIndex).trim();
  }

  // Extract personName (the LAST @ in the string before payment method)
  // Note: we just need the single word after @ for personName
  let personName: string | null = null;
  let descriptionParts = messageWithoutPayment;

  const personMatch = messageWithoutPayment.match(/@(\w+)/);
  if (personMatch && personMatch[1]) {
    personName = personMatch[1];
    // Remove the @PersonName part from description parts
    descriptionParts = messageWithoutPayment.replace(new RegExp(`@${personName}\\s*`, "i"), "");
  }

  if (!personName) return null;

  const descriptionRegex = new RegExp(`^${command}\\s+${parts[1]}\\s*`, "i");
  const description = descriptionParts.replace(descriptionRegex, "").trim() || "Catatan Hutang";

  return { type, amount, personName, description, paymentMethod };
}
