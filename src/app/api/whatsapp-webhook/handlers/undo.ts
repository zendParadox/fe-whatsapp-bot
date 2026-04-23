import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

export async function handleUndo(ctx: CommandContext): Promise<NextResponse | null> {
  if (ctx.command !== "hapus" && ctx.command !== "undo" && ctx.command !== "batal") return null;

  const lastTx = await prisma.transaction.findFirst({
    where: { user_id: ctx.user.id },
    orderBy: { created_at: "desc" },
    include: { category: true }
  });

  if (!lastTx) {
    return NextResponse.json({ message: "⚠️ *Tidak Ada Transaksi*\n\nTidak ada transaksi yang bisa dihapus. Mulai catat transaksi baru!" });
  }

  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const txLocalTime = toZonedTime(lastTx.created_at, TIMEZONE);
  const isToday = nowWIB.toDateString() === txLocalTime.toDateString();
  if (!isToday) {
    return NextResponse.json({
      message: `⚠️ *Tidak Bisa Dihapus*\n\nTransaksi terakhir sudah bukan hari ini.\nHanya transaksi hari ini yang bisa di-undo.\n\n📝 *Transaksi terakhir:*\nRp ${lastTx.amount.toNumber().toLocaleString("id-ID")} - ${lastTx.description}\n(Tanggal: ${formatInTimeZone(txLocalTime, TIMEZONE, "dd/MM/yyyy")})`
    });
  }

  // Prepare the operations for atomic undo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaOperations: any[] = [];
  let walletRevertInfo = "";
  
  if (lastTx.wallet_id) {
    try {
      const txAmount = lastTx.amount.toNumber();
      const revertedWallet = await prisma.wallet.findUnique({ where: { id: lastTx.wallet_id } });
      
      if (revertedWallet) {
        if (lastTx.type === "EXPENSE") {
          prismaOperations.push(prisma.wallet.update({ where: { id: lastTx.wallet_id }, data: { balance: { increment: txAmount } } }));
        } else {
          prismaOperations.push(prisma.wallet.update({ where: { id: lastTx.wallet_id }, data: { balance: { decrement: txAmount } } }));
        }
        walletRevertInfo = `\n💳 *Kantong:* ${revertedWallet.name} (saldo dikembalikan)`;
      }
    } catch (walletErr) {
      console.error("Failed to prepare wallet revert:", walletErr);
    }
  }

  prismaOperations.push(prisma.transaction.delete({ where: { id: lastTx.id } }));

  try {
    await prisma.$transaction(prismaOperations);
  } catch (error) {
    console.error("Undo transaction failed:", error);
    return NextResponse.json({ message: "❌ Gagal membatalkan transaksi karena kesalahan server." });
  }

  const typeEmoji = lastTx.type === "INCOME" ? "📈" : "📉";
  const typeText = lastTx.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

  return NextResponse.json({
    message: `🗑️ *Transaksi Dihapus!*\n━━━━━━━━━━━━━━━━━\n${typeEmoji} *Tipe:* ${typeText}\n💰 *Nominal:* Rp ${lastTx.amount.toNumber().toLocaleString("id-ID")}\n📂 *Kategori:* ${lastTx.category?.name || '-'}\n📝 *Keterangan:* ${lastTx.description}${walletRevertInfo}\n━━━━━━━━━━━━━━━━━\n\n✅ Transaksi sudah dibatalkan`
  });
}
