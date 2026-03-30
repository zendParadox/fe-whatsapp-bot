import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { normalizePhone, formatMoneyBot } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import type { CommandContext } from "./lib/context";

// Handlers
import { handleGreeting } from "./handlers/greeting";
import { handleTransaction } from "./handlers/transaction";
import { handleBudget } from "./handlers/budget";
import { handleReport } from "./handlers/report";
import { handleUndo } from "./handlers/undo";
import { handleDebt } from "./handlers/debt";
import { handleWallet } from "./handlers/wallet";
import { handleHelp, handleFreeUserFallback, handleFallbackHelp } from "./handlers/help";
import { handleAITransaction } from "./handlers/ai-transaction";
import { handleSplitBill } from "./handlers/splitbill";

const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
  chat_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = webhookPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 }
      );
    }

    const { sender, message, chat_id } = parsed.data;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ message: "Empty message" });
    }

    // ── Resolve Sender ──
    let normalizedSender = sender;
    let lidValue: string | null = null;

    // Normalize: strip @xxx suffix and :device identifier, keep only digits
    let rawSender = sender;
    const hasLidSuffix = sender.endsWith("@lid");
    if (rawSender.includes("@")) {
      rawSender = rawSender.split("@")[0];
    }
    if (rawSender.includes(":")) {
      rawSender = rawSender.split(":")[0];
    }
    rawSender = rawSender.replace(/\D/g, "");

    // Detect LID: either @lid suffix, or by length/prefix pattern (matches image route logic)
    const isLid = hasLidSuffix ||
      rawSender.length > 15 ||
      (!rawSender.startsWith("62") && !rawSender.startsWith("61") && !rawSender.startsWith("0") && rawSender.length > 10);

    if (isLid) {
      lidValue = rawSender; // Use the numeric-only LID for DB lookup
      const mapping = await prisma.lidMapping.findFirst({
        where: { lid: lidValue },
        include: { user: true }
      });

      if (mapping) {
        normalizedSender = mapping.phone;
      } else {
        // Check if the message itself is a phone number (LID registration)
        const phoneToSave = normalizePhone(message.trim());
        if (/^\d{10,15}$/.test(phoneToSave)) {
          const targetUser = await prisma.user.findUnique({
            where: { whatsapp_jid: phoneToSave }
          });

          if (targetUser) {
            await prisma.lidMapping.create({
              data: { lid: lidValue, phone: phoneToSave, user_id: targetUser.id }
            });
            return NextResponse.json({
              message: `✅ *Berhasil!*\n\nNomor *${phoneToSave}* telah terhubung dengan perangkat ini.\n\nSekarang Anda bisa menggunakan GoTEK Bot dari perangkat ini. Ketik *halo* untuk memulai! 🚀`
            });
          } else {
            return NextResponse.json({
              message: `❌ Nomor *${phoneToSave}* belum terdaftar.\n\nSilakan daftar dulu di:\nhttps://gotek.vercel.app/register`
            });
          }
        }

        console.log(`⚠️ No LID mapping found for: ${lidValue}`);
        return NextResponse.json({
          message: `🔗 *Hubungkan Akun Anda*\n\nNomor Anda belum terhubung ke akun GoTEK.\n\nUntuk menghubungkan, silakan *balas pesan ini dengan nomor telepon Anda* yang sudah terdaftar.\n\nContoh: \`081234567890\``
        });
      }
    } else {
      normalizedSender = normalizePhone(rawSender);
    }

    console.log(`Webhook received sender: ${sender} -> Normalized: ${normalizedSender}${isLid ? ' (via LID mapping)' : ''}`);

    // ── Find User ──
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: normalizedSender },
    });

    if (!user) {
      console.log(`❌ User not found for sender: ${normalizedSender}`);
      return NextResponse.json({
        message: "❌ Nomor Anda belum terdaftar. Silakan daftar terlebih dahulu di https://gotek.vercel.app/register",
      });
    }

    // Update LID mapping with user_id if needed
    if (lidValue) {
      await prisma.lidMapping.updateMany({
        where: { lid: lidValue, user_id: null },
        data: { user_id: user.id }
      });
    }

    const fmt = (amount: number) => formatMoneyBot(amount, user.currency);
    const initialLower = message.toLowerCase().trim();
    
    // Determine if the message came from a group
    // The new Go bot payload sends chat_id explicitly. If missing, fallback to checking sender (for backward compatibility)
    const isGroup = (chat_id && chat_id.includes("@g.us")) || sender.includes("@g.us");

    // ── Group Chat Mention Filter ──
    if (isGroup) {
      // Allow if the message explicitly tags the bot with '@' variations, 
      // or if it's explicitly summoning the bot via prefix.
      const isBotMentioned = initialLower.includes("@gotek") || 
                             initialLower.includes("@bot") || 
                             initialLower.includes("@asisten") ||
                             initialLower.includes("@66190395355362");
      
      if (!isBotMentioned) {
        console.log(`Msg from group ignored (Bot not explicitly tagged): ${initialLower.substring(0, 20)}...`);
        return NextResponse.json({ message: "" }, { status: 200 });
      }
    }

    // ── Sanitize Bot Mentions ──
    // Strip out the bot mention so it doesn't accidentally interfere with categories (e.g., @makan) or persons (e.g., @Budi)
    const sanitizedMessage = message.replace(/@(gotek|bot|asisten)/gi, "").replace(/[ \t]+/g, " ").trim();
    const args = sanitizedMessage.split(/\s+/);
    const command = args[0]?.toLowerCase() || "";
    const lower = sanitizedMessage.toLowerCase();
    const trimmedMessage = sanitizedMessage.toLowerCase();

    const ctx: CommandContext = {
      user,
      message: sanitizedMessage,
      lower,
      trimmedMessage,
      command,
      args,
      fmt,
      isGroup,
    };

    // ── Dispatch to Handlers (in order of priority) ──
    const handlers = [
      handleGreeting,
      handleTransaction,
      handleBudget,
      handleReport,
      handleUndo,
      handleSplitBill,
      handleDebt,
      handleWallet,
      handleHelp,
      handleFreeUserFallback,
      handleAITransaction,
    ];

    for (const handler of handlers) {
      const response = await handler(ctx);
      if (response) return response;
    }

    // ── Fallback: no handler matched ──
    const fallbackResponse = await handleFallbackHelp(ctx);
    if (fallbackResponse) return fallbackResponse;

    // Return empty response so the bot stays silent
    return NextResponse.json({ message: "" }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Maaf, terjadi kesalahan internal di server." },
      { status: 500 }
    );
  }
}
