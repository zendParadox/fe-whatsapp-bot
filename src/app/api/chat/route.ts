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

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Failed to process with AI" },
        { status: 500 }
      );
    }

    // Return the array directly. Frontend will be updated to handle it.
    // Or if we want to keep backward compatibility with "parsedData as ParsedTransaction",
    // we could just return { data: result[0], all: result }.
    // But better to return the full array in a new field or just data.
    // For now, let's just assume SmartAiInput will be updated to read data[0] if it expects object,
    // or we update SmartAiInput.
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("API Chat Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
