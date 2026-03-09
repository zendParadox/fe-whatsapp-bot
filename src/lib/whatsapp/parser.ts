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


/**
 * Parses Split-Bill message.
 *
 * Equal split:
 *   "patungan 300k makan kfc @andi @budi @cindy #bca"
 *   → totalAmount=300000, splits=[{name:"andi"},{name:"budi"},{name:"cindy"}], each gets 300k/4
 *
 * Custom split (each person has their own amount):
 *   "patungan makan @andi 50k @budi 78500 @cindy 108700 #bca"
 *   → splits=[{name:"andi",amount:50000},{name:"budi",amount:78500},{name:"cindy",amount:108700}]
 *
 * Optional totalAmount at position 1 (after keyword). If missing -> sum of all custom splits.
 */
export function parseSplitBillMessage(message: string) {
  const trimmed = message.trim();

  // 1. Detect keyword
  const firstWord = trimmed.split(" ")[0].toLowerCase();
  if (!["patungan", "split", "bagi"].includes(firstWord)) return null;

  // 2. Extract payment method (last # tag)
  const lastHashIndex = trimmed.lastIndexOf("#");
  let paymentMethod: string | null = null;
  let body = trimmed;

  if (lastHashIndex !== -1) {
    paymentMethod = trimmed.substring(lastHashIndex + 1).trim() || null;
    body = trimmed.substring(0, lastHashIndex).trim();
  }

  // 3. Remove the keyword from the beginning
  const afterKeyword = body.replace(new RegExp(`^${firstWord}\\s*`, "i"), "").trim();

  // 4. Try to parse a global total amount right after the keyword
  const words = afterKeyword.split(/\s+/);
  let globalTotal: number | null = null;
  let descriptionStart = afterKeyword;

  if (words.length > 0) {
    const possibleAmount = parseSmartAmount(words[0]);
    if (possibleAmount !== null && possibleAmount > 0) {
      globalTotal = possibleAmount;
      descriptionStart = words.slice(1).join(" ");
    }
  }

  // 5. Extract @mentions with optional amounts
  // regex: @name optionally followed by whitespace+amount
  const mentionRegex = /@(\w+)(?:\s+([\d.,]+(?:k|rb|jt|juta|m)?))?/gi;
  const splits: { name: string; amount: number | null }[] = [];
  let match;

  while ((match = mentionRegex.exec(descriptionStart)) !== null) {
    const personName = match[1];
    const personAmountStr = match[2] || null;
    const personAmount = personAmountStr ? parseSmartAmount(personAmountStr) : null;
    splits.push({ name: personName, amount: personAmount });
  }

  if (splits.length === 0) return null; // no mentions found

  // 6. Determine mode: custom if ANY split has amount, equal otherwise
  const hasCustomAmounts = splits.some(s => s.amount !== null);

  // 7. Extract description (everything before the first @)
  const firstAtIdx = descriptionStart.indexOf("@");
  const description = firstAtIdx > 0
    ? descriptionStart.substring(0, firstAtIdx).trim()
    : "Patungan";

  if (hasCustomAmounts) {
    // === CUSTOM MODE ===
    // Fill in missing custom amounts with 0
    const finalSplits = splits.map(s => ({
      name: s.name,
      amount: s.amount ?? 0,
    }));
    const sumOfSplits = finalSplits.reduce((acc, s) => acc + s.amount, 0);
    const total = globalTotal ?? sumOfSplits;
    const userPortion = total - sumOfSplits; // remainder for the sender

    return {
      mode: "CUSTOM" as const,
      totalAmount: total,
      userPortion: Math.max(userPortion, 0),
      splits: finalSplits,
      description: description || "Patungan",
      paymentMethod,
    };
  } else {
    // === EQUAL MODE ===
    if (globalTotal === null || globalTotal <= 0) return null; // need total for equal split

    const totalPeople = splits.length + 1; // including the user
    const perPerson = Math.round(globalTotal / totalPeople);
    const finalSplits = splits.map(s => ({
      name: s.name,
      amount: perPerson,
    }));

    return {
      mode: "EQUAL" as const,
      totalAmount: globalTotal,
      userPortion: perPerson,
      splits: finalSplits,
      description: description || "Patungan",
      paymentMethod,
    };
  }
}

