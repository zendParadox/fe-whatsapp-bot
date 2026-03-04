import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { DebtType, DebtStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDebtMessage } from "@/lib/whatsapp/parser";
import { formatInTimeZone } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

export async function handleDebt(ctx: CommandContext): Promise<NextResponse | null> {
  if (ctx.command === "hutang" || ctx.command === "piutang") {
    return handleCreateDebt(ctx);
  }

  if (ctx.command === "cek" && (ctx.args[1] === "hutang" || ctx.args[1] === "piutang")) {
    return handleCheckDebt(ctx);
  }

  if (ctx.command === "lunas" || ctx.command === "bayar") {
    return handlePayDebt(ctx);
  }

  return null;
}

async function handleCreateDebt(ctx: CommandContext): Promise<NextResponse> {
  const parsedData = parseDebtMessage(ctx.message);

  if (!parsedData) {
    const exampleType = ctx.command === "hutang" ? "hutang" : "piutang";
    const explanation = ctx.command === "hutang" ? "Anda meminjam uang dari orang lain" : "Orang lain meminjam uang dari Anda";
    return NextResponse.json({
      message: `❌ *Format ${ctx.command.charAt(0).toUpperCase() + ctx.command.slice(1)} Salah*\n\n📌 *Format yang benar:*\n\`${exampleType} 50k @Budi beli pulsa\`\n\n📝 *Penjelasan:*\n• \`${exampleType}\` = ${explanation}\n• \`50k\` = Jumlah (k=ribu, jt=juta)\n• \`@Budi\` = Nama orang\n• \`beli pulsa\` = Keterangan\n\n💡 *Contoh lain:*\n\`${exampleType} 1jt @Ani modal usaha\`\n\`${exampleType} 200k @Doni bayar makan\``
    });
  }

  await prisma.debt.create({
    data: {
      user_id: ctx.user.id,
      type: parsedData.type,
      amount: new Decimal(parsedData.amount),
      person_name: parsedData.personName,
      description: parsedData.description,
      status: DebtStatus.UNPAID
    }
  });

  const isHutang = parsedData.type === DebtType.HUTANG;
  const emoji = isHutang ? "🔴" : "🟢";
  const typeLabel = isHutang ? "HUTANG" : "PIUTANG";
  const relation = isHutang ? "Anda meminjam dari" : "Anda meminjamkan ke";

  return NextResponse.json({
    message: `${emoji} *${typeLabel} Tercatat!*\n━━━━━━━━━━━━━━━━━\n👤 *${relation}:* ${parsedData.personName}\n💰 *Jumlah:* Rp ${parsedData.amount.toLocaleString("id-ID")}\n📝 *Keterangan:* ${parsedData.description}\n📅 *Tanggal:* ${formatInTimeZone(new Date(), TIMEZONE, "dd/MM/yyyy")}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik \"cek hutang\" untuk lihat daftar_\n💡 _Ketik \"lunas @${parsedData.personName}\" jika sudah dibayar_`
  });
}

async function handleCheckDebt(ctx: CommandContext): Promise<NextResponse> {
  const debts = await prisma.debt.findMany({
    where: { user_id: ctx.user.id, status: DebtStatus.UNPAID },
    orderBy: { created_at: "desc" }
  });

  if (debts.length === 0) {
    return NextResponse.json({
      message: "🎉 *Selamat!*\n\nTidak ada hutang/piutang yang belum lunas!\n\nKeuangan Anda bersih! 💚"
    });
  }

  const hutangList = debts.filter(d => d.type === DebtType.HUTANG);
  const piutangList = debts.filter(d => d.type === DebtType.PIUTANG);
  const totalHutang = hutangList.reduce((acc, d) => acc + d.amount.toNumber(), 0);
  const totalPiutang = piutangList.reduce((acc, d) => acc + d.amount.toNumber(), 0);

  let reply = `📒 *Daftar Hutang & Piutang*\n━━━━━━━━━━━━━━━━━\n`;

  if (hutangList.length > 0) {
    reply += `\n🔴 *HUTANG* (Anda Pinjam)\n`;
    reply += `💰 Total: Rp ${totalHutang.toLocaleString("id-ID")}\n\n`;
    hutangList.forEach((d, i) => {
      reply += `${i + 1}. *${d.person_name}*\n`;
      reply += `   Rp ${d.amount.toNumber().toLocaleString("id-ID")}\n`;
      if (d.description) reply += `   📝 ${d.description}\n`;
    });
  }

  if (piutangList.length > 0) {
    if (hutangList.length > 0) reply += `\n`;
    reply += `🟢 *PIUTANG* (Orang Pinjam ke Anda)\n`;
    reply += `💰 Total: Rp ${totalPiutang.toLocaleString("id-ID")}\n\n`;
    piutangList.forEach((d, i) => {
      reply += `${i + 1}. *${d.person_name}*\n`;
      reply += `   Rp ${d.amount.toNumber().toLocaleString("id-ID")}\n`;
      if (d.description) reply += `   📝 ${d.description}\n`;
    });
  }

  reply += `\n━━━━━━━━━━━━━━━━━\n`;
  reply += `📊 *Summary:*\n`;
  reply += `🔴 Hutang: Rp ${totalHutang.toLocaleString("id-ID")} (${hutangList.length} orang)\n`;
  reply += `🟢 Piutang: Rp ${totalPiutang.toLocaleString("id-ID")} (${piutangList.length} orang)\n`;

  const netBalance = totalPiutang - totalHutang;
  const netEmoji = netBalance >= 0 ? "💚" : "💔";
  reply += `${netEmoji} Net: Rp ${netBalance.toLocaleString("id-ID")}\n`;
  reply += `\n💡 _Ketik "lunas @Nama" jika sudah dibayar_`;

  return NextResponse.json({ message: reply });
}

async function handlePayDebt(ctx: CommandContext): Promise<NextResponse> {
  const personMatch = ctx.message.match(/@(\w+)/);
  const personName = personMatch && personMatch[1] ? personMatch[1] : null;

  if (!personName) {
    return NextResponse.json({
      message: "❌ *Format Lunas Salah*\n\n📌 *Format yang benar:*\n\`lunas @Budi\`\n\n📝 *Penjelasan:*\nSebutkan nama orang yang hutang/piutangnya sudah dibayar.\n\n💡 _Ketik \"cek hutang\" untuk lihat daftar_"
    });
  }

  const unpaidDebts = await prisma.debt.findMany({
    where: {
      user_id: ctx.user.id,
      person_name: { equals: personName, mode: "insensitive" },
      status: DebtStatus.UNPAID
    }
  });

  if (unpaidDebts.length === 0) {
    return NextResponse.json({
      message: `⚠️ *Tidak Ditemukan*\n\nTidak ada hutang/piutang aktif dengan nama *${personName}*.\n\n💡 _Cek penulisan nama atau ketik "cek hutang"_`
    });
  }

  const totalAmount = unpaidDebts.reduce((acc, d) => acc + d.amount.toNumber(), 0);
  const hasHutang = unpaidDebts.some(d => d.type === DebtType.HUTANG);
  const hasPiutang = unpaidDebts.some(d => d.type === DebtType.PIUTANG);

  await prisma.debt.updateMany({
    where: {
      user_id: ctx.user.id,
      person_name: { equals: personName, mode: "insensitive" },
      status: DebtStatus.UNPAID
    },
    data: { status: DebtStatus.PAID }
  });

  let typeInfo = "";
  if (hasHutang && hasPiutang) typeInfo = "hutang & piutang";
  else if (hasHutang) typeInfo = "hutang";
  else typeInfo = "piutang";

  return NextResponse.json({
    message: `✅ *LUNAS!*\n━━━━━━━━━━━━━━━━━\n👤 *Nama:* ${personName}\n💰 *Total:* Rp ${totalAmount.toLocaleString("id-ID")}\n📒 *Jenis:* ${unpaidDebts.length} ${typeInfo}\n━━━━━━━━━━━━━━━━━\n\n🎉 Semua ${typeInfo} dengan *${personName}* sudah lunas!`
  });
}
