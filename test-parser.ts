import { parseDebtMessage, parseSplitBillMessage } from "./src/lib/whatsapp/parser.js";

console.log("--- DEBT PARSER ---");
const debtTestCases = [
  "hutang 50k @Budi beli pulsa #gopay",
  "hutang beli pulsa 50k @Budi #gopay"
];

for (const t of debtTestCases) {
  console.log(`Input: "${t}"`);
  console.log(JSON.stringify(parseDebtMessage(t), null, 2));
}

console.log("\n--- SPLIT BILL PARSER ---");
const splitTestCases = [
  "patungan 300k makan kfc @andi @budi",
  "patungan makan kfc 300k @andi @budi",
  "patungan makan @andi 50k @budi 70k"
];

for (const t of splitTestCases) {
  console.log(`Input: "${t}"`);
  console.log(JSON.stringify(parseSplitBillMessage(t), null, 2));
}
