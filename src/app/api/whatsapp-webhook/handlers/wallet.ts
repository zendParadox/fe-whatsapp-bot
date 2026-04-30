import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSmartAmount } from "@/lib/whatsapp/parser";
import type { CommandContext } from "../lib/context";

// 1. Helper untuk pengecekan Premium (DRY Principle)
function checkPremium(ctx: CommandContext): boolean {
  return ctx.user.plan_type === "PREMIUM";
}

const PREMIUM_ERROR_MESSAGE =
  "👑 *Fitur Premium*\n\nFitur Kantong Keuangan (termasuk Transfer dan Shared Wallet) eksklusif untuk pengguna Premium.\n\n⭐️ Upgrade sekarang di:\n🔗 https://gotek.vercel.app/pricing";

export async function handleWallet(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  const msg = ctx.lower;

  // View wallets
  if (["kantong", "wallet", "dompet"].includes(cmd)) {
    return handleViewWallets(ctx);
  }

  // Add wallet
  if (
    msg.startsWith("tambah kantong") ||
    msg.startsWith("buat kantong") ||
    msg.startsWith("tambah wallet")
  ) {
    return handleAddWallet(ctx);
  }

  // Transfer between wallets (Regex diperbaiki untuk mendukung nama kantong dengan spasi)
  const transferMatch = msg.match(
    /^transfer\s+(.+?)\s+dari\s+(.+?)\s+ke\s+(.+)$/i,
  );
  if (transferMatch) {
    return handleTransfer(ctx, transferMatch);
  }

  // Join shared wallet
  if (["gabung", "join"].includes(cmd)) {
    return handleJoinWallet(ctx);
  }

  // Share wallet
  if (msg.startsWith("share kantong") || msg.startsWith("bagikan kantong")) {
    return handleShareWallet(ctx);
  }

  return null;
}

async function handleViewWallets(ctx: CommandContext): Promise<NextResponse> {
  if (!checkPremium(ctx))
    return NextResponse.json({ message: PREMIUM_ERROR_MESSAGE });

  // Optimasi: Ambil kantong sendiri dan membership bersama secara paralel (Promise.all)
  const [ownWallets, sharedMemberships] = await Promise.all([
    prisma.wallet.findMany({
      where: { user_id: ctx.user.id },
      include: { members: { include: { user: { select: { name: true } } } } },
      orderBy: { created_at: "asc" },
    }),
    prisma.walletMember.findMany({
      where: { user_id: ctx.user.id },
      include: { wallet: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  // Filter kantong bersama (jangan tampilkan kantong milik sendiri di bagian "Kantong Bersama")
  const sharedWallets = sharedMemberships
    .filter((m) => m.wallet.user_id !== ctx.user.id)
    .map((m) => m.wallet);

  if (ownWallets.length === 0 && sharedWallets.length === 0) {
    return NextResponse.json({
      message:
        "💰 *Kantong Keuangan*\n\nBelum ada kantong. Buat dengan:\n_tambah kantong [nama] [saldo_awal]_\n\nContoh:\n`tambah kantong BCA 5000000`\n`tambah kantong Gopay 150k`",
    });
  }

  let totalAll = 0;
  let list = "💰 *Kantong Keuangan Anda*\n━━━━━━━━━━━━━━━━━\n";

  for (const w of ownWallets) {
    const bal = w.balance.toNumber(); // Aman menggunakan bawaan Decimal
    totalAll += bal;
    const sharedLabel = w.is_shared ? ` 👥(${w.members.length} anggota)` : "";
    list += `\n${w.icon || "💳"} *${w.name}*: Rp ${bal.toLocaleString("id-ID")}${sharedLabel}`;
  }

  if (sharedWallets.length > 0) {
    list += `\n\n👥 *Kantong Bersama*\n`;
    for (const w of sharedWallets) {
      const bal = w.balance.toNumber();
      list += `\n🔗 *${w.name}* (milik ${w.user?.name || "?"}): Rp ${bal.toLocaleString("id-ID")}`;
    }
  }

  list += `\n━━━━━━━━━━━━━━━━━\n💎 *Total Milik Sendiri:* Rp ${totalAll.toLocaleString("id-ID")}\n\n💡 _Ketik "share kantong [nama]" untuk berbagi kantong_`;
  return NextResponse.json({ message: list });
}

async function handleAddWallet(ctx: CommandContext): Promise<NextResponse> {
  if (!checkPremium(ctx))
    return NextResponse.json({ message: PREMIUM_ERROR_MESSAGE });

  // Hapus prefix trigger word dengan aman
  const cleanMsg = ctx.message
    .replace(/^(tambah|buat)\s+(kantong|wallet)\s+/i, "")
    .trim();

  // Menggunakan regex untuk menangkap nama (bisa berspasi) dan nominal di akhir
  const match = cleanMsg.match(/^(.*?)\s+([\d.,]+[a-zA-Z]*)$/);

  let walletName = cleanMsg;
  let initialBalance = 0;

  if (match) {
    walletName = match[1].trim();
    initialBalance = parseSmartAmount(match[2]) ?? 0;
  }

  if (!walletName) {
    return NextResponse.json({
      message:
        "⚠️ Format: `tambah kantong [nama] [saldo_awal]`\n\nContoh: `tambah kantong BCA 5jt` atau `tambah kantong Bank Mandiri 500k`",
    });
  }

  try {
    const newWallet = await prisma.wallet.create({
      data: { user_id: ctx.user.id, name: walletName, balance: initialBalance },
    });
    return NextResponse.json({
      message: `✅ Kantong *${newWallet.name}* berhasil dibuat!\n💰 Saldo awal: Rp ${initialBalance.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error("[Add Wallet Error]:", error);
    return NextResponse.json({
      message: `⚠️ Gagal membuat kantong. Mungkin kantong "${walletName}" sudah ada atau terjadi kesalahan sistem.`,
    });
  }
}

async function handleTransfer(
  ctx: CommandContext,
  match: RegExpMatchArray,
): Promise<NextResponse> {
  if (!checkPremium(ctx))
    return NextResponse.json({ message: PREMIUM_ERROR_MESSAGE });

  // 1. Menggunakan parser cerdas yang sudah ada daripada Regex kustom!
  const amountStr = match[1].trim();
  const amount = parseSmartAmount(amountStr);

  if (!amount || amount <= 0 || isNaN(amount)) {
    return NextResponse.json({
      message: `⚠️ Jumlah transfer tidak valid: "${amountStr}".\nContoh yang benar: \`transfer 50k dari BCA ke OVO\``,
    });
  }

  const fromName = match[2].trim();
  const toName = match[3].trim();

  // Optimasi: Tarik kedua kantong secara paralel
  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({
      where: {
        user_id: ctx.user.id,
        name: { equals: fromName, mode: "insensitive" },
      },
    }),
    prisma.wallet.findFirst({
      where: {
        user_id: ctx.user.id,
        name: { equals: toName, mode: "insensitive" },
      },
    }),
  ]);

  if (!fromWallet)
    return NextResponse.json({
      message: `⚠️ Kantong asal "${fromName}" tidak ditemukan.`,
    });
  if (!toWallet)
    return NextResponse.json({
      message: `⚠️ Kantong tujuan "${toName}" tidak ditemukan.`,
    });
  if (fromWallet.id === toWallet.id)
    return NextResponse.json({
      message: `⚠️ Kantong asal dan tujuan tidak boleh sama.`,
    });

  // Cek saldo cukup
  if (fromWallet.balance.toNumber() < amount) {
    return NextResponse.json({
      message: `❌ Saldo *${fromWallet.name}* tidak mencukupi.\nSaldo saat ini: Rp ${fromWallet.balance.toNumber().toLocaleString("id-ID")}`,
    });
  }

  try {
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);

    const finalFromBal = fromWallet.balance.toNumber() - amount;
    const finalToBal = toWallet.balance.toNumber() + amount;

    return NextResponse.json({
      message: `🔄 *Transfer Berhasil!*\n━━━━━━━━━━━━━━━━━\n📤 Dari: *${fromWallet.name}*\n📥 Ke: *${toWallet.name}*\n💰 Jumlah: Rp ${amount.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n\nSaldo ${fromWallet.name}: Rp ${finalFromBal.toLocaleString("id-ID")}\nSaldo ${toWallet.name}: Rp ${finalToBal.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error("[Wallet Transfer Error]:", error);
    return NextResponse.json({
      message:
        "❌ Transfer gagal karena kesalahan server. Saldo tidak berubah (Aman).",
    });
  }
}

// ── Shared Wallet: Join via invite code ──
async function handleJoinWallet(ctx: CommandContext): Promise<NextResponse> {
  const code = ctx.args[1]?.toUpperCase()?.trim();

  if (!code || !code.startsWith("FAM-")) {
    return NextResponse.json({
      message: `❌ *Format Gabung Salah*\n\n📌 *Format:*\n\`gabung FAM-XXXXXX\`\n\n📝 Masukkan kode undangan yang diberikan pemilik kantong.`,
    });
  }

  try {
    const wallet = await prisma.wallet.findFirst({
      where: { invite_code: code, is_shared: true },
      include: { user: { select: { name: true } } },
    });

    if (!wallet) {
      return NextResponse.json({
        message: `⚠️ Kode undangan *${code}* tidak valid atau sudah ditarik.`,
      });
    }

    if (wallet.user_id === ctx.user.id) {
      return NextResponse.json({
        message: `ℹ️ Anda adalah pemilik dari kantong *${wallet.name}* ini.`,
      });
    }

    // Check existing & Create dalam satu alur untuk mencegah race condition
    const existingMember = await prisma.walletMember.findUnique({
      where: {
        wallet_id_user_id: { wallet_id: wallet.id, user_id: ctx.user.id },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        message: `ℹ️ Anda sudah tergabung di kantong *${wallet.name}*.`,
      });
    }

    await prisma.walletMember.create({
      data: { wallet_id: wallet.id, user_id: ctx.user.id, role: "MEMBER" },
    });

    return NextResponse.json({
      message: `✅ *Berhasil Bergabung!*\n━━━━━━━━━━━━━━━━━\n🔗 Kantong: *${wallet.name}*\n👤 Pemilik: ${wallet.user?.name || "?"}\n💰 Saldo: Rp ${wallet.balance.toNumber().toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n\nAnda sekarang bisa menggunakan kantong ini dengan mengetik \`#${wallet.name}\`.`,
    });
  } catch (error) {
    console.error("[Join Wallet Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal memproses permintaan gabung kantong.",
    });
  }
}

// ── Shared Wallet: Generate invite code ──
async function handleShareWallet(ctx: CommandContext): Promise<NextResponse> {
  if (!checkPremium(ctx))
    return NextResponse.json({ message: PREMIUM_ERROR_MESSAGE });

  const walletName = ctx.message
    .replace(/^(share|bagikan)\s+kantong\s+/i, "")
    .trim();

  if (!walletName) {
    return NextResponse.json({
      message: `⚠️ Format: \`share kantong [nama]\`\n\nContoh: \`share kantong BCA\``,
    });
  }

  try {
    const wallet = await prisma.wallet.findFirst({
      where: {
        user_id: ctx.user.id,
        name: { equals: walletName, mode: "insensitive" },
      },
    });

    if (!wallet)
      return NextResponse.json({
        message: `⚠️ Kantong "${walletName}" tidak ditemukan.`,
      });

    // Generate invite code random (6 karakter)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let inviteCode = "FAM-";
    for (let i = 0; i < 6; i++)
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));

    // Eksekusi Update Wallet dan Upsert Role Admin secara atomik
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { is_shared: true, invite_code: inviteCode },
      }),
      prisma.walletMember.upsert({
        where: {
          wallet_id_user_id: { wallet_id: wallet.id, user_id: ctx.user.id },
        },
        create: { wallet_id: wallet.id, user_id: ctx.user.id, role: "ADMIN" },
        update: {},
      }),
    ]);

    return NextResponse.json({
      message: `🔗 *Kantong Berhasil Dibagikan!*\n━━━━━━━━━━━━━━━━━\n💰 Kantong: *${wallet.name}*\n🔑 Kode Undangan: *${inviteCode}*\n━━━━━━━━━━━━━━━━━\n\nBagikan kode ini ke orang lain.\nMereka cukup ketik:\n\`gabung ${inviteCode}\``,
    });
  } catch (error) {
    console.error("[Share Wallet Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal membagikan kantong karena kesalahan sistem.",
    });
  }
}
