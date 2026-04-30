import { NextResponse } from "next/server";
import { Prisma, DebtType, DebtStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSplitBillMessage } from "@/lib/whatsapp/parser";
import { formatInTimeZone } from "date-fns-tz";
import { resolveContactName } from "@/lib/whatsapp/resolve-name";
import type { CommandContext } from "../lib/context";
import { findAccessibleWalletByName } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";
const SPLIT_COMMANDS = new Set(["patungan", "split", "bagi"]);

export async function handleSplitBill(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  if (!SPLIT_COMMANDS.has(cmd)) return null;

  try {
    const parsed = parseSplitBillMessage(ctx.message);

    if (!parsed) {
      return NextResponse.json({
        message: `❌ *Format Patungan Salah*\n\n📌 *Cara Pakai:*\n\n*Bagi Rata:*\n\`patungan 300k makan @andi @budi @cindy\`\n\n*Bagi Kustom (beda-beda):*\n\`patungan makan @andi 50k @budi 78500 @cindy 108700\`\n\n*Dengan Kantong (Premium):*\n\`patungan 300k makan @andi @budi #bca\`\n\n📝 *Penjelasan:*\n• \`patungan\` / \`split\` / \`bagi\` = Kata kunci\n• \`300k\` = Total tagihan (opsional di mode kustom)\n• \`@nama jumlah\` = Nama orang dan nominal masing-masing\n• \`#bca\` = Kantong/wallet (opsional, Premium)\n\n💡 _User yang mengirim pesan ikut dihitung sebagai salah satu pembayar._`,
      });
    }

    // ── 1. Wallet Lookup (Premium only) ──
    let walletId: string | undefined = undefined;
    let walletName = "";

    // Gunakan type assertion yang aman
    const isPremium = ctx.user.plan_type === "PREMIUM";

    if (parsed.paymentMethod && isPremium) {
      const wallet = await findAccessibleWalletByName(
        ctx.user.id,
        parsed.paymentMethod,
      );
      if (wallet) {
        walletId = wallet.id;
        walletName = wallet.name;
      }
    }

    // ── 2. Optimasi N+1 Query pada Resolusi Nama Kontak ──
    const resolvedNamesMap = new Map<string, string>();

    // Mengeksekusi pencarian nama kontak secara paralel (bersamaan)
    await Promise.all(
      parsed.splits.map(async (split) => {
        const resolved = await resolveContactName(split.name);
        resolvedNamesMap.set(split.name, resolved);
      }),
    );

    // ── 3. Persiapan Prisma Operations yang Type-Safe (Bebas 'any') ──
    const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];

    // Create expense untuk porsi user sendiri
    if (parsed.userPortion > 0) {
      prismaOperations.push(
        prisma.transaction.create({
          data: {
            user_id: ctx.user.id,
            type: TransactionType.EXPENSE,
            amount: parsed.userPortion, // Prisma Decimal otomatis menerima number
            description: `[Patungan] ${parsed.description}`,
            wallet_id: walletId,
            // Catatan: Jika schema Anda mewajibkan category_id, tambahkan logika default category di sini
          } as Prisma.TransactionUncheckedCreateInput, // Menggunakan UncheckedInput sbg pengganti 'as any' jika ada relasi yang dilewati
        }),
      );
    }

    // Create piutang (debt) untuk masing-masing orang
    for (const split of parsed.splits) {
      const resolved = resolvedNamesMap.get(split.name) || split.name;

      prismaOperations.push(
        prisma.debt.create({
          data: {
            user_id: ctx.user.id,
            type: DebtType.PIUTANG,
            amount: split.amount,
            person_name: resolved,
            description: `[Patungan] ${parsed.description}`,
            status: DebtStatus.UNPAID,
            wallet_id: walletId,
          } as Prisma.DebtUncheckedCreateInput,
        }),
      );
    }

    // Deduct wallet dengan TOTAL amount
    if (walletId && isPremium) {
      prismaOperations.push(
        prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: parsed.totalAmount } },
        }),
      );
    }

    // ── 4. Eksekusi Atomik ──
    if (prismaOperations.length > 0) {
      await prisma.$transaction(prismaOperations);
    }

    // ── 5. Build Response ──
    const names = parsed.splits.map(
      (s) => resolvedNamesMap.get(s.name) || s.name,
    );

    let details = "";
    if (parsed.mode === "EQUAL") {
      const allNames = ["Anda", ...names].join(", ");
      details += `👥 Dibagi rata: ${parsed.splits.length + 1} orang (${allNames})\n`;
      details += `💵 Masing-masing: Rp ${parsed.userPortion.toLocaleString("id-ID")}\n`;
    } else {
      details += `✅ Pengeluaran Anda: Rp ${parsed.userPortion.toLocaleString("id-ID")}\n`;
      for (const s of parsed.splits) {
        const resolved = resolvedNamesMap.get(s.name) || s.name;
        details += `✅ Piutang ${resolved}: Rp ${s.amount.toLocaleString("id-ID")}\n`;
      }
    }

    const walletInfo = walletName
      ? `\n🏦 *Kantong:* ${walletName} (-Rp ${parsed.totalAmount.toLocaleString("id-ID")})`
      : "";
    const dateFormatted = formatInTimeZone(new Date(), TIMEZONE, "dd/MM/yyyy");

    return NextResponse.json({
      message: `🍕 *Split Bill Tercatat!*\n━━━━━━━━━━━━━━━━━\n💰 *Total:* Rp ${parsed.totalAmount.toLocaleString("id-ID")} (${parsed.description})\n📅 *Tanggal:* ${dateFormatted}\n\n${details}${walletInfo}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik "cek hutang" untuk lihat semua piutang_\n💡 _Ketik "lunas @${names[0] || "nama"}" jika sudah dibayar_`,
    });
  } catch (error) {
    console.error("[SplitBill Error]:", error);
    return NextResponse.json({
      message:
        "❌ Gagal memproses data patungan karena kesalahan sistem. Mohon coba sesaat lagi.",
    });
  }
}
