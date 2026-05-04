import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CommandContext } from "../lib/context";
import { sendWhatsAppMessageAsync } from "@/lib/whatsapp/send";

export async function handleAITransaction(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  if (ctx.user.plan_type === "FREE") return null;

  // 1. Fetch User Categories
  const userCategories = await prisma.category.findMany({
    where: { user_id: ctx.user.id },
  });
  const categoryNames = userCategories.map((c) => c.name);

  // 2. Construct Prompt for Meta AI
  // We enforce strict JSON output and inject the user's JID so the response can be routed back.
const prompt = `Anda adalah asisten keuangan otomatis. Ekstrak pesan berikut menjadi format JSON HANYA. JANGAN membalas dengan kata-kata lain selain block JSON.

PESAN TRANSAKSI: "${ctx.message}"
KATEGORI YANG TERSEDIA: [${categoryNames.join(", ")}]

PENTING: Anda HARUS selalu mengembalikan field "user_jid": "${ctx.user.whatsapp_jid}" meskipun gagal mendeteksi transaksi.
Jika gagal atau pesan tidak relevan, kembalikan transactions sebagai array kosong [].

Format JSON yang diwajibkan:
{
  "user_jid": "${ctx.user.whatsapp_jid}",
  "transactions": [
    {
      "type": "EXPENSE", // atau INCOME
      "amount": 50000, // angka murni tanpa titik
      "category": "nama_kategori", // pilih dari daftar yang tersedia atau buat nama baru yang relevan
      "description": "keterangan opsional"
    }
  ]
}`;

  // 3. Send Prompt to Meta AI asynchronously
  const metaAIJid = "718584497008509@bot";
  sendWhatsAppMessageAsync(metaAIJid, prompt);

  // 4. Return processing message to User
  return NextResponse.json({
    message: "⏳ Sedang diproses oleh AI kami...",
  });
}

