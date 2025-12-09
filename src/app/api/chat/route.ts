import { NextRequest, NextResponse } from "next/server";
import { parseTransactionFromText } from "@/lib/gemini";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 2. Call Gemini
    const result = await parseTransactionFromText(message);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to process with AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("API Chat Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
