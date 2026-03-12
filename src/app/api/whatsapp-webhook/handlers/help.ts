import { NextResponse } from "next/server";
import type { CommandContext } from "../lib/context";

export async function handleHelp(ctx: CommandContext): Promise<NextResponse | null> {
  // Penjelasan detail / tutorial / panduan
  if (ctx.trimmedMessage === "penjelasan detail" || ctx.trimmedMessage === "tutorial" || ctx.trimmedMessage === "panduan") {
    return NextResponse.json({ message: getDetailedHelp() });
  }

  // Help / bantuan
  if (ctx.trimmedMessage === "help" || ctx.trimmedMessage === "bantuan") {
    return NextResponse.json({ message: getShortHelp() });
  }

  // Upgrade / premium
  if (ctx.command === "upgrade" || ctx.command === "premium") {
    return handleUpgrade(ctx);
  }

  return null;
}

// Free user fallback — shown when no other command matches, ONLY if bot is mentioned (if in group)
export async function handleFreeUserFallback(ctx: CommandContext): Promise<NextResponse | null> {
  if ((ctx.user as Record<string, unknown>).plan_type === "FREE") {
    // In private chats, always show help. In groups, only if explicitly mentioned.
    if (!ctx.isGroup || ctx.lower.includes("gotek") || ctx.lower.includes("bot") || ctx.lower.match(/^(help|bantuan|panduan|tanya)/)) {
      return NextResponse.json({ message: getFreeUserHelp() });
    }
  }
  return null;
}

// Fallback help for any unrecognized command
export async function handleFallbackHelp(ctx: CommandContext): Promise<NextResponse | null> {
  // In private chats, always show help. In groups, only if explicitly mentioned.
  if (!ctx.isGroup || ctx.lower.includes("gotek") || ctx.lower.includes("bot") || ctx.lower.match(/^(help|bantuan|panduan|tanya)/)) {
    return NextResponse.json({ message: getShortHelp() });
  }
  return null;
}

function handleUpgrade(ctx: CommandContext): NextResponse {
  const isPremium = (ctx.user as Record<string, unknown>).plan_type === "PREMIUM";
  if (isPremium) {
    return NextResponse.json({
      message: `👑 *Status Premium Aktif*\n━━━━━━━━━━━━━━━━━\nTerima kasih, ${ctx.user.name || "Sobat GoTEK"}! Anda pelanggan Premium.\n\n🔓 *Fitur Aktif Anda:*\n✅ AI Smart Parser (ketik bebas)\n📸 Scan Struk otomatis\n💰 Kantong Keuangan (bank & e-wallet)\n📤 Export Laporan PDF & Excel\n📊 Analisis Keuangan AI Bulanan\n🎯 Kategori Budget tak terbatas\n━━━━━━━━━━━━━━━━━\n\n💡 Ketik *kantong* untuk cek saldo kantong Anda.`
    });
  }

  return NextResponse.json({
    message: `⭐️ *Upgrade ke GoTEK Premium!* ⭐️\n\nBuka semua fitur AI Asisten Keuangan:\n✅ AI Smart Parser — ketik bebas, langsung tercatat\n📸 Scan Struk — kirim foto, auto tercatat\n💰 Kantong Keuangan — lacak saldo bank & e-wallet\n📤 Export Laporan PDF & Excel\n📊 AI Financial Analysis bulanan\n🎯 Kategori Budget tak terbatas\n\n🔥 *Langganan Lebih Lama, Harga Lebih Murah!*\nMulai Rp 15.000/Bulan jika berlangganan 1 Tahun.\n\nUpgrade sekarang:\n🔗 https://gotek.vercel.app/pricing\n\n💡 _Dukung karya anak bangsa. Kami juga butuh kopi!_ ☕`
  });
}

function getShortHelp(): string {
  return `🤖 *GoTEK Bot - Panduan Singkat*
━━━━━━━━━━━━━━━━━

🆓 *FITUR GRATIS:*
📝 *Catat*: \`keluar 18k sabun @kebutuhan\` atau \`masuk 5jt gaji @kerja\`
📒 *Hutang*: \`hutang 100k @Budi\` | \`lunas @Budi\`
🎯 *Budget*: \`budget 1jt @makan\` | \`cek budget\`
📊 *Laporan*: \`laporan hari\` | \`minggu\` | \`bulan\`

👑 *FITUR PREMIUM:*
🤖 *AI Parser*: Ketik bebas nyatet keuangan atau cukup kirim *FOTO STRUK*!
💳 *Kantong*: Lacak saldo Bank & E-Wallet (BCA, Gopay, OVO, dll).
📤 *Export*: Simpan riwayat dalam bentuk PDF/Excel!

━━━━━━━━━━━━━━━━━
💡 *BINGUNG CARANYA?* 🔥
Penjelasan lengkap format manual, tutorial detail fitur, cara undo (hapus) transaksi, hingga foto panduannya bisa dibaca di sini:
👉 🌐 *https://gotek.vercel.app/guide*

_Ketik *upgrade* untuk berlangganan._`;
}

function getFreeUserHelp(): string {
  return `🤖 *GoTEK Bot - Panduan Singkat*
━━━━━━━━━━━━━━━━━

🆓 *FITUR GRATIS:*
📝 *Catat*: \`keluar 18k sabun @kebutuhan\` atau \`masuk 5jt gaji @kerja\`
📒 *Hutang*: \`hutang 100k @Budi\` | \`lunas @Budi\`
🎯 *Budget*: \`budget 1jt @makan\` | \`cek budget\`
📊 *Laporan*: \`laporan hari\` | \`minggu\` | \`bulan\`

👑 *FITUR PREMIUM:*
🤖 *AI Parser*: Ketik bebas nyatet keuangan atau cukup kirim *FOTO STRUK*!
💳 *Kantong*: Lacak saldo Bank & E-Wallet (BCA, Gopay, OVO, dll).
📤 *Export*: Simpan riwayat dalam bentuk PDF/Excel!

━━━━━━━━━━━━━━━━━
💡 *BINGUNG CARANYA?* 🔥
Penjelasan lengkap format manual, tutorial detail fitur, cara undo (hapus) transaksi, hingga foto panduannya bisa dibaca di sini:
👉 🌐 *https://gotek.vercel.app/guide*

_Ketik *upgrade* untuk berlangganan._`;
}

function getDetailedHelp(): string {
  return `📖 *PANDUAN GOTEK BOT*
━━━━━━━━━━━━━━━━━

� *Catat Keuangan*
\`keluar 50k makan siang @makan\`
\`masuk 5jt gaji @kerja\`

� *Hutang / Piutang*
\`hutang 100k @Budi\` · \`lunas @Budi\`

🍕 *Patungan*
\`patungan 300k makan @andi @budi\`

🎯 *Budget*
\`budget 1jt @makan\` · \`cek budget\`

📊 *Laporan*
\`laporan hari\` · \`minggu\` · \`bulan\`

↩️ *Koreksi*
\`undo\` — hapus transaksi terakhir

👑 *Premium*
🤖 Ketik bebas / kirim foto struk
💳 \`kantong\` · \`share kantong BCA\`

━━━━━━━━━━━━━━━━━
� *Panduan lengkap + contoh + gambar:*
👉 🌐 *https://gotek.vercel.app/guide*

_Ketik *help* untuk ringkasan singkat._`;
}
