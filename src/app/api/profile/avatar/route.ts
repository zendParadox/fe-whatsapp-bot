import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { supabase, AVATAR_BUCKET } from "@/lib/supabase";
import sharp from "sharp";

const prisma = new PrismaClient();

// Avatar settings
const AVATAR_SIZE = 256; // 256x256 pixels
const AVATAR_QUALITY = 80; // WebP quality (0-100)

// POST - Upload avatar
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    // Limit file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = "webp";
    const fileName = `${payload.userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert to buffer and compress with sharp
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Resize to 256x256, convert to WebP with compression
    const compressedBuffer = await sharp(inputBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer();

    console.log(`📸 Avatar compressed: ${file.size} bytes → ${compressedBuffer.length} bytes (${Math.round((1 - compressedBuffer.length / file.size) * 100)}% smaller)`);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, compressedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Gagal mengupload gambar" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { avatar_url: true },
    });

    if (user?.avatar_url) {
      // Extract old file path from URL
      const oldPath = user.avatar_url.split(`${AVATAR_BUCKET}/`)[1];
      if (oldPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
      }
    }

    // Update user's avatar_url
    await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar_url: avatarUrl },
    });

    return NextResponse.json({
      ok: true,
      avatar_url: avatarUrl,
      message: "Foto profil berhasil diperbarui",
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE() {
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { avatar_url: true },
    });

    if (user?.avatar_url) {
      // Extract file path from URL
      const filePath = user.avatar_url.split(`${AVATAR_BUCKET}/`)[1];
      if (filePath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
      }
    }

    // Clear avatar_url in database
    await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar_url: null },
    });

    return NextResponse.json({
      ok: true,
      message: "Foto profil berhasil dihapus",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
