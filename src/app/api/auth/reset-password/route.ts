// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   try {
//     const { token, newPassword } = await req.json();

//     if (!token || !newPassword) {
//       return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
//     }

//     // Find token in DB
//     const resetToken = await prisma.resetPasswordToken.findUnique({
//       where: { token },
//       include: { user: true },
//     });

//     if (!resetToken) {
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
//     }

//     // Check expiration
//     if (new Date() > resetToken.expiresAt) {
//       // Optionally delete expired token here
//       await prisma.resetPasswordToken.delete({ where: { id: resetToken.id } });
//       return NextResponse.json({ error: "Token has expired" }, { status: 400 });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update user password
//     await prisma.user.update({
//       where: { id: resetToken.userId },
//       data: { password: hashedPassword },
//     });

//     // Delete used token
//     await prisma.resetPasswordToken.delete({ where: { id: resetToken.id } });

//     return NextResponse.json({ message: "Password reset successful" });
//   } catch (error) {
//     console.error("Reset password error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
