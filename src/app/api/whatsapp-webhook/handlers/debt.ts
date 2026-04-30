import { NextResponse } from "next/server";
import { Prisma, DebtType, DebtStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { parseDebtMessage } from "@/lib/whatsapp/parser";
import { formatInTimeZone } from "date-fns-tz";
import { resolveContactName } from "@/lib/whatsapp/resolve-name";
import type { CommandContext } from "../lib/context";
import { findAccessibleWalletByName } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";

export async function handleDebt(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  const arg1 = ctx.args[1]?.toLowerCase();

  // Routing perintah yang lebih ringkas
  if (["hutang", "piutang"].includes(cmd)) return handleCreateDebt(ctx);
  if (cmd === "cek" && ["hutang", "piutang"].includes(arg1))
    return handleCheckDebt(ctx);
  if (["lunas", "bayar"].includes(cmd)) return handlePayDebt(ctx);

  return null;
}

async function handleCreateDebt(ctx: CommandContext): Promise<NextResponse> {
  try {
    const parsedData = parseDebtMessage(ctx.message);

    if (!parsedData) {
      const exampleType = ctx.command === "hutang" ? "hutang" : "piutang";
      const explanation =
        ctx.command === "hutang"
          ? "Anda meminjam uang dari orang lain"
          : "Orang lain meminjam uang dari Anda";
      return NextResponse.json({
        message: `❌ *Format ${ctx.command.charAt(0).toUpperCase() + ctx.command.slice(1)} Salah*\n\n📌 *Format yang benar:*\n\`${exampleType} 50k @Budi beli pulsa\`\natau\n\`${exampleType} 50k @Budi beli pulsa #gopay\`\n\n📝 *Penjelasan:*\n• \`${exampleType}\` = ${explanation}\n• \`50k\` = Jumlah (k=ribu, jt=juta)\n• \`@Budi\` = Nama orang\n• \`beli pulsa\` = Keterangan\n• \`#gopay\` = Kantong (opsional)\n\n💡 *Contoh lain:*\n\`${exampleType} 1jt @Ani modal usaha #bca\``,
      });
    }

    let finalWalletId: string | null = null;
    let walletNameDisplay = "";

    // Perbaikan TypeScript: Menggunakan tipe PrismaPromise daripada 'any'
    const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];

    if (parsedData.paymentMethod && ctx.user.plan_type === "PREMIUM") {
      const wallet = await findAccessibleWalletByName(
        ctx.user.id,
        parsedData.paymentMethod,
      );

      if (wallet) {
        finalWalletId = wallet.id;
        walletNameDisplay = `\n🏦 *Kantong:* ${wallet.name}`;

        prismaOperations.push(
          prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                [parsedData.type === "HUTANG" ? "increment" : "decrement"]:
                  parsedData.amount,
              },
            },
          }),
        );
      }
    }

    const resolvedName = await resolveContactName(parsedData.personName);

    prismaOperations.push(
      prisma.debt.create({
        data: {
          user_id: ctx.user.id,
          type: parsedData.type,
          amount: new Decimal(parsedData.amount),
          person_name: resolvedName,
          description: parsedData.description,
          wallet_id: finalWalletId, // Asumsi field ini ada di schema prisma Anda
          status: DebtStatus.UNPAID,
        },
      }),
    );

    if (prismaOperations.length > 0) {
      await prisma.$transaction(prismaOperations);
    }

    const isHutang = parsedData.type === DebtType.HUTANG;
    const emoji = isHutang ? "🔴" : "🟢";
    const typeLabel = isHutang ? "HUTANG" : "PIUTANG";
    const relation = isHutang ? "Anda meminjam dari" : "Anda meminjamkan ke";
    const dateFormatted = formatInTimeZone(new Date(), TIMEZONE, "dd/MM/yyyy");
    const amountFormatted = parsedData.amount.toLocaleString("id-ID");

    return NextResponse.json({
      message: `${emoji} *${typeLabel} Tercatat!*\n━━━━━━━━━━━━━━━━━\n👤 *${relation}:* ${resolvedName}\n💰 *Jumlah:* Rp ${amountFormatted}\n📝 *Keterangan:* ${parsedData.description}${walletNameDisplay}\n📅 *Tanggal:* ${dateFormatted}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik "cek hutang" untuk lihat daftar_\n💡 _Ketik "lunas @${resolvedName}" jika sudah dibayar_`,
    });
  } catch (error) {
    console.error("[handleCreateDebt Error]:", error);
    return NextResponse.json({
      message:
        "❌ Gagal memproses data pinjaman karena kesalahan sistem. Coba lagi ya!",
    });
  }
}

async function handleCheckDebt(ctx: CommandContext): Promise<NextResponse> {
  try {
    const debts = await prisma.debt.findMany({
      where: { user_id: ctx.user.id, status: DebtStatus.UNPAID },
      orderBy: { created_at: "desc" },
    });

    if (debts.length === 0) {
      return NextResponse.json({
        message:
          "🎉 *Selamat!*\n\nTidak ada hutang/piutang yang belum lunas!\n\nKeuangan Anda bersih! 💚",
      });
    }

    const hutangList = debts.filter((d) => d.type === DebtType.HUTANG);
    const piutangList = debts.filter((d) => d.type === DebtType.PIUTANG);

    const totalHutang = hutangList.reduce(
      (acc, d) => acc + d.amount.toNumber(),
      0,
    );
    const totalPiutang = piutangList.reduce(
      (acc, d) => acc + d.amount.toNumber(),
      0,
    );

    // Fungsi helper untuk merender daftar
    const renderList = (list: typeof debts) => {
      return list
        .map((d, i) => {
          let item = `${i + 1}. *${d.person_name}*\n   Rp ${d.amount.toNumber().toLocaleString("id-ID")}`;
          if (d.description) item += `\n   📝 ${d.description}`;
          return item;
        })
        .join("\n");
    };

    let reply = `📒 *Daftar Hutang & Piutang*\n━━━━━━━━━━━━━━━━━\n`;

    if (hutangList.length > 0) {
      reply += `\n🔴 *HUTANG* (Anda Pinjam)\n💰 Total: Rp ${totalHutang.toLocaleString("id-ID")}\n\n${renderList(hutangList)}\n`;
    }

    if (piutangList.length > 0) {
      reply += `\n🟢 *PIUTANG* (Orang Pinjam ke Anda)\n💰 Total: Rp ${totalPiutang.toLocaleString("id-ID")}\n\n${renderList(piutangList)}\n`;
    }

    const netBalance = totalPiutang - totalHutang;
    const netEmoji = netBalance >= 0 ? "💚" : "💔";

    reply += `\n━━━━━━━━━━━━━━━━━\n📊 *Summary:*\n🔴 Hutang: Rp ${totalHutang.toLocaleString("id-ID")} (${hutangList.length} orang)\n🟢 Piutang: Rp ${totalPiutang.toLocaleString("id-ID")} (${piutangList.length} orang)\n${netEmoji} Net: Rp ${netBalance.toLocaleString("id-ID")}\n\n💡 _Ketik "lunas @Nama" jika sudah dibayar_`;

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[handleCheckDebt Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal mengambil data hutang/piutang. Sistem sedang sibuk.",
    });
  }
}

async function handlePayDebt(ctx: CommandContext): Promise<NextResponse> {
  try {
    const personMatch = ctx.message.match(/@([a-zA-Z0-9_.-]+)/); // Update regex sedikit untuk support nama dengan . atau -
    let personName = personMatch && personMatch[1] ? personMatch[1] : null;

    if (personName) {
      personName = await resolveContactName(personName);
    }

    if (!personName) {
      return NextResponse.json({
        message: `❌ *Format Lunas Salah*\n\n📌 *Format yang benar:*\n\`lunas @Budi\`\natau\n\`lunas @Budi #cash\`\n\n💡 _Ketik "cek hutang" untuk lihat daftar_`,
      });
    }

    const lastHashIndex = ctx.message.lastIndexOf("#");
    const paymentMethod =
      lastHashIndex !== -1
        ? ctx.message.substring(lastHashIndex + 1).trim()
        : null;

    const unpaidDebts = await prisma.debt.findMany({
      where: {
        user_id: ctx.user.id,
        person_name: { equals: personName, mode: "insensitive" },
        status: DebtStatus.UNPAID,
      },
    });

    if (unpaidDebts.length === 0) {
      return NextResponse.json({
        message: `⚠️ *Tidak Ditemukan*\n\nTidak ada hutang/piutang aktif dengan nama *${personName}*.`,
      });
    }

    let finalWalletId: string | null = null;
    let repaymentWalletInfo = "";

    if (ctx.user.plan_type === "PREMIUM" && paymentMethod) {
      const wallet = await prisma.wallet.findFirst({
        where: {
          user_id: ctx.user.id,
          name: { equals: paymentMethod, mode: "insensitive" },
        },
      });
      if (wallet) {
        finalWalletId = wallet.id;
        repaymentWalletInfo = `\n🏦 *Kantong Tujuan:* ${wallet.name}`;
      }
    }

    // Perbaikan TypeScript: Hapus `any`
    const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];
    const walletCache = new Map<string, boolean>();

    for (const debt of unpaidDebts) {
      // Hapus type casting Record<string, unknown> karena seharusnya wallet_id ada di schema Debt
      const targetWalletId = finalWalletId || debt.wallet_id;

      if (targetWalletId && ctx.user.plan_type === "PREMIUM") {
        let walletExists = walletCache.get(targetWalletId);

        if (walletExists === undefined) {
          const wallet = await prisma.wallet.findUnique({
            where: { id: targetWalletId }, // findUnique lebih cepat dari findFirst jika id adalah PK
          });
          // Pastikan wallet milik user tersebut
          if (wallet && wallet.user_id === ctx.user.id) {
            walletCache.set(targetWalletId, true);
            walletExists = true;
          } else {
            walletCache.set(targetWalletId, false);
            walletExists = false;
          }
        }

        if (walletExists) {
          prismaOperations.push(
            prisma.wallet.update({
              where: { id: targetWalletId },
              data: {
                balance: {
                  [debt.type === "HUTANG" ? "decrement" : "increment"]:
                    debt.amount,
                },
              },
            }),
          );
        }
      }

      prismaOperations.push(
        prisma.debt.update({
          where: { id: debt.id },
          data: { status: DebtStatus.PAID },
        }),
      );
    }

    if (prismaOperations.length > 0) {
      await prisma.$transaction(prismaOperations);
    }

    const totalAmount = unpaidDebts.reduce(
      (acc, d) => acc + d.amount.toNumber(),
      0,
    );
    const hasHutang = unpaidDebts.some((d) => d.type === DebtType.HUTANG);
    const hasPiutang = unpaidDebts.some((d) => d.type === DebtType.PIUTANG);

    const typeInfo =
      hasHutang && hasPiutang
        ? "hutang & piutang"
        : hasHutang
          ? "hutang"
          : "piutang";

    return NextResponse.json({
      message: `✅ *LUNAS!*\n━━━━━━━━━━━━━━━━━\n👤 *Nama:* ${personName}\n💰 *Total:* Rp ${totalAmount.toLocaleString("id-ID")}\n📒 *Jenis:* ${unpaidDebts.length} ${typeInfo}${repaymentWalletInfo}\n━━━━━━━━━━━━━━━━━\n\n🎉 Semua ${typeInfo} dengan *${personName}* sudah lunas!`,
    });
  } catch (error) {
    console.error("[handlePayDebt Error]:", error);
    return NextResponse.json({
      message:
        "❌ Gagal memproses pelunasan karena kesalahan server. Mohon coba sesaat lagi.",
    });
  }
}
