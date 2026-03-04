import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSmartAmount } from "@/lib/whatsapp/parser";
import type { CommandContext } from "../lib/context";

export async function handleWallet(ctx: CommandContext): Promise<NextResponse | null> {
  // View wallets
  if (ctx.command === "kantong" || ctx.command === "wallet" || ctx.command === "dompet") {
    return handleViewWallets(ctx);
  }

  // Add wallet
  if (ctx.lower.startsWith("tambah kantong") || ctx.lower.startsWith("buat kantong") || ctx.lower.startsWith("tambah wallet")) {
    return handleAddWallet(ctx);
  }

  // Transfer between wallets
  const transferMatch = ctx.lower.match(/^transfer\s+([\d.,]+[kmjbt]?)\s+dari\s+(\w+)\s+ke\s+(\w+)$/i);
  if (transferMatch) {
    return handleTransfer(ctx, transferMatch);
  }

  return null;
}

async function handleViewWallets(ctx: CommandContext): Promise<NextResponse> {
  if ((ctx.user as Record<string, unknown>).plan_type !== "PREMIUM") {
    return NextResponse.json({
      message: "👑 *Fitur Premium*\n\nFitur Kantong Keuangan hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
    });
  }

  const wallets = await prisma.wallet.findMany({
    where: { user_id: ctx.user.id },
    orderBy: { created_at: "asc" },
  });

  if (wallets.length === 0) {
    return NextResponse.json({
      message: "💰 *Kantong Keuangan*\n\nBelum ada kantong. Buat dengan:\n_tambah kantong [nama] [saldo_awal]_\n\nContoh:\n`tambah kantong BCA 5000000`\n`tambah kantong Gopay 150000`"
    });
  }

  let totalAll = 0;
  let list = "💰 *Kantong Keuangan Anda*\n━━━━━━━━━━━━━━━━━\n";
  for (const w of wallets) {
    const bal = Number(w.balance);
    totalAll += bal;
    list += `\n${w.icon || "💰"} *${w.name}*: Rp ${bal.toLocaleString("id-ID")}`;
  }
  list += `\n━━━━━━━━━━━━━━━━━\n💎 *Total:* Rp ${totalAll.toLocaleString("id-ID")}`;
  return NextResponse.json({ message: list });
}

async function handleAddWallet(ctx: CommandContext): Promise<NextResponse> {
  if ((ctx.user as Record<string, unknown>).plan_type !== "PREMIUM") {
    return NextResponse.json({
      message: "👑 *Fitur Premium*\n\nFitur Kantong Keuangan hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
    });
  }

  const parts = ctx.message.replace(/^(tambah|buat)\s+(kantong|wallet)\s+/i, "").trim().split(/\s+/);
  const walletName = parts[0];
  const initialBalance = parts[1] ? (parseSmartAmount(parts[1]) ?? 0) : 0;

  if (!walletName) {
    return NextResponse.json({
      message: "⚠️ Format: `tambah kantong [nama] [saldo_awal]`\n\nContoh: `tambah kantong BCA 5jt` atau `tambah kantong Gopay 500k`"
    });
  }

  try {
    const newWallet = await prisma.wallet.create({
      data: { user_id: ctx.user.id, name: walletName, balance: initialBalance },
    });
    return NextResponse.json({
      message: `✅ Kantong *${newWallet.name}* berhasil dibuat!\n💰 Saldo awal: Rp ${initialBalance.toLocaleString("id-ID")}`
    });
  } catch {
    return NextResponse.json({
      message: `⚠️ Kantong "${walletName}" sudah ada atau terjadi error.`
    });
  }
}

async function handleTransfer(ctx: CommandContext, match: RegExpMatchArray): Promise<NextResponse> {
  if ((ctx.user as Record<string, unknown>).plan_type !== "PREMIUM") {
    return NextResponse.json({
      message: "👑 *Fitur Premium*\n\nFitur Transfer antar Kantong hanya untuk pengguna Premium."
    });
  }

  let amount = parseFloat(match[1].replace(/,/g, ".").replace(/[^\d.]/g, ""));
  const suffix = match[1].slice(-1).toLowerCase();
  if (suffix === "k") amount *= 1000;
  else if (suffix === "j" || suffix === "m") amount *= 1000000;
  else if (suffix === "b" || suffix === "t") amount *= 1000000000;

  const fromName = match[2];
  const toName = match[3];

  const fromWallet = await prisma.wallet.findFirst({
    where: { user_id: ctx.user.id, name: { equals: fromName, mode: "insensitive" } },
  });
  const toWallet = await prisma.wallet.findFirst({
    where: { user_id: ctx.user.id, name: { equals: toName, mode: "insensitive" } },
  });

  if (!fromWallet) return NextResponse.json({ message: `⚠️ Kantong "${fromName}" tidak ditemukan.` });
  if (!toWallet) return NextResponse.json({ message: `⚠️ Kantong "${toName}" tidak ditemukan.` });

  await prisma.wallet.update({ where: { id: fromWallet.id }, data: { balance: { decrement: amount } } });
  await prisma.wallet.update({ where: { id: toWallet.id }, data: { balance: { increment: amount } } });

  return NextResponse.json({
    message: `🔄 *Transfer Berhasil!*\n━━━━━━━━━━━━━━━━━\n📤 Dari: *${fromWallet.name}*\n📥 Ke: *${toWallet.name}*\n💰 Jumlah: Rp ${amount.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n\nSaldo ${fromWallet.name}: Rp ${(Number(fromWallet.balance) - amount).toLocaleString("id-ID")}\nSaldo ${toWallet.name}: Rp ${(Number(toWallet.balance) + amount).toLocaleString("id-ID")}`
  });
}
