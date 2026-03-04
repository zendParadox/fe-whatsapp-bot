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

// Free user fallback — shown when no other command matches
export async function handleFreeUserFallback(ctx: CommandContext): Promise<NextResponse | null> {
  if ((ctx.user as Record<string, unknown>).plan_type === "FREE") {
    return NextResponse.json({ message: getFreeUserHelp() });
  }
  return null;
}

// Fallback help for any unrecognized command
export async function handleFallbackHelp(): Promise<NextResponse> {
  return NextResponse.json({ message: getShortHelp() });
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
  return `📖 *PANDUAN LENGKAP GOTEK BOT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 *1. CATAT PENGELUARAN*
Format: \`keluar [jumlah] [keterangan] @[kategori]\`

*Contoh:*
• \`keluar 18k beli sabun mandi @kebutuhan pribadi\`
• \`keluar 50k makan siang @makan\`
• \`keluar 100k belanja @kebutuhan rumah\`

📝 *Penjelasan:*
- \`keluar\` = tipe pengeluaran (bisa juga: expense, out)
- \`18k\` = Rp 18.000 (k=ribu, jt=juta, rb=ribu)
- \`beli sabun mandi\` = keterangan transaksi
- \`@kebutuhan pribadi\` = kategori (bisa lebih dari 1 kata!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *2. CATAT PEMASUKAN*
Format: \`masuk [jumlah] [keterangan] @[kategori]\`

*Contoh:*
• \`masuk 5jt gaji bulan februari @pekerjaan\`
• \`masuk 500k uang freelance @kerja sampingan\`
• \`masuk 1.5jt bonus tahunan @bonus\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📒 *3. HUTANG & PIUTANG*
• \`hutang 100k @Budi pinjam modal\` - Anda pinjam dari Budi
• \`piutang 50k @Ani buat pulsa\` - Ani pinjam dari Anda
• \`cek hutang\` - Lihat semua hutang/piutang
• \`lunas @Budi\` - Tandai lunas

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *4. BUDGET*
• \`budget 1jt @makan\` - Set budget kategori
• \`cek budget\` - Lihat status budget

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *5. LAPORAN*
• \`laporan hari\` - Ringkasan hari ini
• \`laporan minggu\` - Ringkasan minggu ini
• \`laporan bulan\` - Ringkasan bulan ini

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *6. KOREKSI*
• \`undo\` atau \`hapus\` - Batalkan transaksi terakhir

━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 *7. KANTONG KEUANGAN* _(Premium)_
• \`kantong\` - Lihat saldo semua kantong
• \`tambah kantong BCA 5000000\` - Buat kantong baru
• \`transfer 500k dari bca ke gopay\` - Transfer antar kantong
• Catat + potong saldo: \`beli makan 20k dari gopay\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *FORMAT JUMLAH:*
• 50k = Rp 50.000
• 1.5jt = Rp 1.500.000
• 500rb = Rp 500.000
• 25000 = Rp 25.000

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *MULTI-TRANSAKSI:*
Kirim beberapa transaksi sekaligus dalam satu pesan!
Pisahkan dengan enter/newline:

\`keluar 18k beli sabun @pribadi
keluar 50k makan siang @makan
masuk 100k uang jajan @bonus\`

🤖 Atau kirim pesan biasa, AI akan otomatis mendeteksi transaksi (KHUSUS PREMIUM)!

🌐 Lengkapnya: https://gotek.vercel.app/guide`;
}
