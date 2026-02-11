import { NextResponse } from "next/server";
import { PrismaClient, FeedbackType } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional().or(z.literal("")),
  message: z.string().min(1, "Pesan tidak boleh kosong"),
  type: z.nativeEnum(FeedbackType).default(FeedbackType.OTHER),
  user_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, email, message, type, user_id } = validation.data;

    // Pastikan email valid jika diisi
    let cleanEmail = email;
    if (email && email.trim() !== "") {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return NextResponse.json({ message: "Email tidak valid" }, { status: 400 });
         }
    } else {
        cleanEmail = null; // Set null jika string kosong atau undefined
    }


    const feedback = await prisma.feedback.create({
      data: {
        name: name || "Anonymous",
        email: cleanEmail,
        message,
        type,
        user_id: user_id || null,
      },
    });

    return NextResponse.json({
      message: "Terima kasih atas masukan Anda!",
      data: feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan feedback." },
      { status: 500 }
    );
  }
}
