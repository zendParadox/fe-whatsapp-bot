import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { DebtType, DebtStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSplitBillMessage } from "@/lib/whatsapp/parser";
import { formatInTimeZone } from "date-fns-tz";
import { resolveContactName } from "@/lib/whatsapp/resolve-name";
import type { CommandContext } from "../lib/context";
import { findAccessibleWalletByName } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";

export async function handleSplitBill(ctx: CommandContext): Promise<NextResponse | null> {
  const cmd = ctx.command;
  if (!["patungan", "split", "bagi"].includes(cmd)) return null;

  const parsed = parseSplitBillMessage(ctx.message);

  if (!parsed) {
    return NextResponse.json({
      message: `❌ *Format Patungan Salah*\n\n📌 *Cara Pakai:*\n\n*Bagi Rata:*\n\`patungan 300k makan @andi @budi @cindy\`\n\n*Bagi Kustom (beda-beda):*\n\`patungan makan @andi 50k @budi 78500 @cindy 108700\`\n\n*Dengan Kantong (Premium):*\n\`patungan 300k makan @andi @budi #bca\`\n\n📝 *Penjelasan:*\n• \`patungan\` / \`split\` / \`bagi\` = Kata kunci\n• \`300k\` = Total tagihan (opsional di mode kustom)\n• \`@nama jumlah\` = Nama orang dan nominal masing-masing\n• \`#bca\` = Kantong/wallet (opsional, Premium)\n\n💡 _User yang mengirim pesan ikut dihitung sebagai salah satu pembayar._`
    });
  }

  // ── Wallet Lookup (Premium only) ──
  let walletId: string | null = null;
  let walletName: string | null = null;

  if (parsed.paymentMethod && ctx.user.plan_type === "PREMIUM") {
    const wallet = await findAccessibleWalletByName(ctx.user.id, parsed.paymentMethod);
    if (wallet) {
      walletId = wallet.id;
      walletName = wallet.name;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaOperations: any[] = [];

  // ── Create expense for user's own portion ──
  if (parsed.userPortion > 0) {
    prismaOperations.push(
      prisma.transaction.create({
        data: {
          user_id: ctx.user.id,
          type: TransactionType.EXPENSE,
          amount: new Decimal(parsed.userPortion),
          description: `[Patungan] ${parsed.description}`,
          ...(walletId ? { wallet_id: walletId } : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })
    );
  }

  // ── Build piutang for each person ──
  const resolvedNames: Record<string, string> = {};

  for (const split of parsed.splits) {
    const resolved = await resolveContactName(split.name);
    resolvedNames[split.name] = resolved;

    prismaOperations.push(
      prisma.debt.create({
        data: {
          user_id: ctx.user.id,
          type: DebtType.PIUTANG,
          amount: new Decimal(split.amount),
          person_name: resolved,
          description: `[Patungan] ${parsed.description}`,
          status: DebtStatus.UNPAID,
          ...(walletId ? { wallet_id: walletId } : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })
    );
  }

  // ── Deduct wallet by TOTAL (user's portion + all piutang) ──
  if (walletId && ctx.user.plan_type === "PREMIUM") {
    prismaOperations.push(
      prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: parsed.totalAmount },
        },
      })
    );
  }

  // ── Execute everything atomically ──
  try {
    if (prismaOperations.length > 0) {
      await prisma.$transaction(prismaOperations);
    }
  } catch (error) {
    console.error("Failed atomic splitbill transaction:", error);
    return NextResponse.json({ message: "❌ Gagal memproses split bill karena kendala server." });
  }

  // ── Build response ──
  const names = parsed.splits.map(s => resolvedNames[s.name]);

  let details = "";
  if (parsed.mode === "EQUAL") {
    const allNames = ["Anda", ...names].join(", ");
    details += `👥 Dibagi rata: ${parsed.splits.length + 1} orang (${allNames})\n`;
    details += `💵 Masing-masing: Rp ${parsed.userPortion.toLocaleString("id-ID")}\n`;
  } else {
    details += `✅ Pengeluaran Anda: Rp ${parsed.userPortion.toLocaleString("id-ID")}\n`;
    for (const s of parsed.splits) {
      details += `✅ Piutang ${resolvedNames[s.name]}: Rp ${s.amount.toLocaleString("id-ID")}\n`;
    }
  }

  const walletInfo = walletName ? `\n🏦 *Kantong:* ${walletName} (-Rp ${parsed.totalAmount.toLocaleString("id-ID")})` : "";

  return NextResponse.json({
    message: `🍕 *Split Bill Tercatat!*\n━━━━━━━━━━━━━━━━━\n💰 *Total:* Rp ${parsed.totalAmount.toLocaleString("id-ID")} (${parsed.description})\n📅 *Tanggal:* ${formatInTimeZone(new Date(), TIMEZONE, "dd/MM/yyyy")}\n\n${details}${walletInfo}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik "cek hutang" untuk lihat semua piutang_\n💡 _Ketik "lunas @${names[0] || 'nama'}" jika sudah dibayar_`
  });
}
