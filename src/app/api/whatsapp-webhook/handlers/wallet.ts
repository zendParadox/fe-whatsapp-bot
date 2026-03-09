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

  // Join shared wallet: "gabung FAM-XXXXXX" 
  if (ctx.command === "gabung" || ctx.command === "join") {
    return handleJoinWallet(ctx);
  }

  // Share wallet: "share kantong BCA" or "bagikan kantong BCA"
  if (ctx.lower.startsWith("share kantong") || ctx.lower.startsWith("bagikan kantong")) {
    return handleShareWallet(ctx);
  }

  return null;
}

async function handleViewWallets(ctx: CommandContext): Promise<NextResponse> {
  if ((ctx.user as Record<string, unknown>).plan_type !== "PREMIUM") {
    return NextResponse.json({
      message: "👑 *Fitur Premium*\n\nFitur Kantong Keuangan hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
    });
  }

  // Get own wallets
  const ownWallets = await prisma.wallet.findMany({
    where: { user_id: ctx.user.id },
    include: { members: { include: { user: { select: { name: true } } } } },
    orderBy: { created_at: "asc" },
  });

  // Get shared wallets where user is a member (not owner)
  const sharedMemberships = await prisma.walletMember.findMany({
    where: { user_id: ctx.user.id },
    include: { 
      wallet: { 
        include: { user: { select: { name: true } } }
      } 
    },
  });

  // Filter to only wallets not owned by this user
  const sharedWallets = sharedMemberships
    .filter(m => m.wallet.user_id !== ctx.user.id)
    .map(m => m.wallet);

  if (ownWallets.length === 0 && sharedWallets.length === 0) {
    return NextResponse.json({
      message: "💰 *Kantong Keuangan*\n\nBelum ada kantong. Buat dengan:\n_tambah kantong [nama] [saldo_awal]_\n\nContoh:\n`tambah kantong BCA 5000000`\n`tambah kantong Gopay 150000`"
    });
  }

  let totalAll = 0;
  let list = "💰 *Kantong Keuangan Anda*\n━━━━━━━━━━━━━━━━━\n";

  for (const w of ownWallets) {
    const bal = Number(w.balance);
    totalAll += bal;
    const sharedLabel = w.is_shared ? ` 👥(${w.members.length} anggota)` : "";
    list += `\n${w.icon || "💰"} *${w.name}*: Rp ${bal.toLocaleString("id-ID")}${sharedLabel}`;
  }

  if (sharedWallets.length > 0) {
    list += `\n\n👥 *Kantong Bersama*\n`;
    for (const w of sharedWallets) {
      const bal = Number(w.balance);
      list += `\n🔗 *${w.name}* (milik ${w.user?.name || "?"}): Rp ${bal.toLocaleString("id-ID")}`;
    }
  }

  list += `\n━━━━━━━━━━━━━━━━━\n💎 *Total Milik Sendiri:* Rp ${totalAll.toLocaleString("id-ID")}`;
  list += `\n\n💡 _Ketik "share kantong [nama]" untuk berbagi kantong_`;
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

// ── Shared Wallet: Join via invite code ──
async function handleJoinWallet(ctx: CommandContext): Promise<NextResponse> {
  const code = ctx.args[1]?.toUpperCase()?.trim();

  if (!code) {
    return NextResponse.json({
      message: `❌ *Format Gabung Salah*\n\n📌 *Format:*\n\`gabung FAM-XXXXXX\`\n\n📝 Masukkan kode undangan yang diberikan pemilik kantong.`
    });
  }

  const wallet = await prisma.wallet.findFirst({
    where: { invite_code: code, is_shared: true },
    include: { user: { select: { name: true } } },
  });

  if (!wallet) {
    return NextResponse.json({
      message: `⚠️ Kode undangan *${code}* tidak valid atau sudah kadaluarsa.`
    });
  }

  if (wallet.user_id === ctx.user.id) {
    return NextResponse.json({
      message: `ℹ️ Anda sudah menjadi pemilik kantong *${wallet.name}*.`
    });
  }

  // Check if already a member
  const existingMember = await prisma.walletMember.findUnique({
    where: { wallet_id_user_id: { wallet_id: wallet.id, user_id: ctx.user.id } },
  });

  if (existingMember) {
    return NextResponse.json({
      message: `ℹ️ Anda sudah menjadi anggota kantong *${wallet.name}*.`
    });
  }

  await prisma.walletMember.create({
    data: {
      wallet_id: wallet.id,
      user_id: ctx.user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({
    message: `✅ *Berhasil Bergabung!*\n━━━━━━━━━━━━━━━━━\n🔗 Kantong: *${wallet.name}*\n👤 Pemilik: ${wallet.user?.name || "?"}\n💰 Saldo: Rp ${Number(wallet.balance).toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n\nSekarang Anda bisa menggunakan kantong ini saat mencatat transaksi dengan \`#${wallet.name}\`.`
  });
}

// ── Shared Wallet: Generate invite code ──
async function handleShareWallet(ctx: CommandContext): Promise<NextResponse> {
  if ((ctx.user as Record<string, unknown>).plan_type !== "PREMIUM") {
    return NextResponse.json({
      message: "👑 *Fitur Premium*\n\nFitur Shared Wallet hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
    });
  }

  const walletName = ctx.message.replace(/^(share|bagikan)\s+kantong\s+/i, "").trim();

  if (!walletName) {
    return NextResponse.json({
      message: `⚠️ Format: \`share kantong [nama]\`\n\nContoh: \`share kantong BCA\``
    });
  }

  const wallet = await prisma.wallet.findFirst({
    where: { user_id: ctx.user.id, name: { equals: walletName, mode: "insensitive" } },
  });

  if (!wallet) {
    return NextResponse.json({
      message: `⚠️ Kantong "${walletName}" tidak ditemukan.`
    });
  }

  // Generate invite code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let inviteCode = "FAM-";
  for (let i = 0; i < 6; i++) {
    inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { is_shared: true, invite_code: inviteCode },
  });

  // Add owner as ADMIN if not already
  await prisma.walletMember.upsert({
    where: { wallet_id_user_id: { wallet_id: wallet.id, user_id: ctx.user.id } },
    create: { wallet_id: wallet.id, user_id: ctx.user.id, role: "ADMIN" },
    update: {},
  });

  return NextResponse.json({
    message: `🔗 *Kantong Berhasil Dibagikan!*\n━━━━━━━━━━━━━━━━━\n💰 Kantong: *${wallet.name}*\n🔑 Kode Undangan: *${inviteCode}*\n━━━━━━━━━━━━━━━━━\n\nBagikan kode ini ke orang lain.\nMereka cukup ketik:\n\`gabung ${inviteCode}\`\n\nuntuk bergabung ke kantong ini.`
  });
}


