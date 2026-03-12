import { parseTransactionMessage, parseSplitBillMessage } from "./src/lib/whatsapp/parser.js";

console.log("--- MULTI NUMBERS TEST ---");
const testCases = [
  "keluar beli 2 kopi 50k @makanan",
  "keluar 50k beli 2 kopi @makanan",
  "patungan makan 3 ayam 300k @andi @budi",
  "patungan 300k makan 3 ayam @andi @budi",
  "hutang beli 2 pulsa 50k @budi"
];

for (const t of testCases) {
  console.log(`Input: "${t}"`);
  const res1 = parseTransactionMessage(t);
  if (res1) console.log("Tx:", res1.amount, res1.description);
  
  const res2 = parseSplitBillMessage(t);
  if (res2) console.log("Split:", res2.totalAmount, res2.description);
}
