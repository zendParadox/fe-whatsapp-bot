import { PaymentMethodType, TransactionType, DebtType } from "@prisma/client";

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


export function parseTransactionMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0].toLowerCase();
  const amount = parseSmartAmount(parts[1]);

  if (amount === null || amount <= 0) return null;

  let type: TransactionType;
  if (["masuk", "income"].includes(command)) {
    type = TransactionType.INCOME;
  } else if (["keluar", "expense"].includes(command)) {
    type = TransactionType.EXPENSE;
  } else {
    return null;
  }

  const categoryMatch = message.match(/@(\w+)/);
  const category =
    categoryMatch && categoryMatch[1]
      ? categoryMatch[1].toLowerCase()
      : "lainnya";

  const paymentMethodMatch = message.match(/#(\w+)/);
  const paymentMethodString = paymentMethodMatch
    ? paymentMethodMatch[1].toUpperCase()
    : "CASH";
  let paymentMethod: PaymentMethodType = PaymentMethodType.CASH;
  if (
    Object.values(PaymentMethodType).includes(
      paymentMethodString as PaymentMethodType
    )
  ) {
    paymentMethod = paymentMethodString as PaymentMethodType;
  }

  const description = message
    .replace(new RegExp(`^${command}`, "i"), "")
    .replace(parts[1], "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
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
