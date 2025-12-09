// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { randomBytes } from "crypto";

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   try {
//     const { email } = await req.json();

//     if (!email) {
//       return NextResponse.json({ error: "Email is required" }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       // Don't reveal if user exists
//       return NextResponse.json({ message: "If your email is registered, you will receive a reset link." });
//     }

//     // Generate token
//     const token = randomBytes(32).toString("hex");
//     const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

//     // Save token to DB
//     await prisma.resetPasswordToken.create({
//       data: {
//         token,
//         expiresAt,
//         userId: user.id,
//       },
//     });

//     // Mock Email Sending
//     const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    
//     console.log("=================================================================");
//     console.log("PASSWORD RESET REQUEST");
//     console.log(`Email: ${email}`);
//     console.log(`Reset Link: ${resetLink}`);
//     console.log("=================================================================");

//     return NextResponse.json({ message: "If your email is registered, you will receive a reset link." });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
