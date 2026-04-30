import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";
const UNDO_TRIGGERS = new Set(["hapus", "undo", "batal"]);

export async function handleUndo(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  if (!UNDO_TRIGGERS.has(cmd)) return null;

  try {
    const lastTx = await prisma.transaction.findFirst({
      where: { user_id: ctx.user.id },
      orderBy: { created_at: "desc" },
      include: { category: { select: { name: true } } },
    });

    if (!lastTx) {
      return NextResponse.json({
        message:
          "⚠️ *Tidak Ada Transaksi*\n\nTidak ada transaksi yang bisa dihapus. Mulai catat transaksi baru!",
      });
    }

    const todayStr = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
    const txDateStr = formatInTimeZone(
      lastTx.created_at,
      TIMEZONE,
      "yyyy-MM-dd",
    );

    if (todayStr !== txDateStr) {
      const txFormattedDate = formatInTimeZone(
        lastTx.created_at,
        TIMEZONE,
        "dd/MM/yyyy",
      );
      const txAmountStr = lastTx.amount.toNumber().toLocaleString("id-ID");

      return NextResponse.json({
        message: `⚠️ *Tidak Bisa Dihapus*\n\nTransaksi terakhir sudah bukan hari ini.\nHanya transaksi hari ini yang bisa di-undo.\n\n📝 *Transaksi terakhir:*\nRp ${txAmountStr} - ${lastTx.description}\n(Tanggal: ${txFormattedDate})`,
      });
    }

    const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];
    let walletRevertInfo = "";

    if (lastTx.wallet_id) {
      const revertedWallet = await prisma.wallet.findUnique({
        where: { id: lastTx.wallet_id },
        select: { id: true, name: true },
      });

      if (revertedWallet) {
        const txAmount = lastTx.amount;

        prismaOperations.push(
          prisma.wallet.update({
            where: { id: lastTx.wallet_id },
            data: {
              balance: {
                [lastTx.type === "EXPENSE" ? "increment" : "decrement"]:
                  txAmount,
              },
            },
          }),
        );
        walletRevertInfo = `\n💳 *Kantong:* ${revertedWallet.name} (saldo dikembalikan)`;
      }
    }

    prismaOperations.push(
      prisma.transaction.delete({ where: { id: lastTx.id } }),
    );

    await prisma.$transaction(prismaOperations);

    const typeEmoji = lastTx.type === "INCOME" ? "📈" : "📉";
    const typeText = lastTx.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
    const amountStr = lastTx.amount.toNumber().toLocaleString("id-ID");
    const catName = lastTx.category?.name || "-";

    return NextResponse.json({
      message: `🗑️ *Transaksi Dihapus!*\n━━━━━━━━━━━━━━━━━\n${typeEmoji} *Tipe:* ${typeText}\n💰 *Nominal:* Rp ${amountStr}\n📂 *Kategori:* ${catName}\n📝 *Keterangan:* ${lastTx.description}${walletRevertInfo}\n━━━━━━━━━━━━━━━━━\n\n✅ Transaksi sudah dibatalkan`,
    });
  } catch (error) {
    console.error("[handleUndo Error]:", error);
    return NextResponse.json({
      message:
        "❌ Gagal membatalkan transaksi karena kesalahan server. Mohon coba sesaat lagi.",
    });
  }
}
