// src/app/api/transactions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UpdatePayload = {
  amount?: number;
  type?: "INCOME" | "EXPENSE";
  description?: string | null;
  category_id?: string | null;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } } // gunakan destructuring di signature
) {
  const id = params?.id;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  // parse body safely
  const body = (await request.json().catch(() => ({}))) as UpdatePayload;

  // build updateData hanya dari field yang diizinkan
  const updateData: UpdatePayload = {};
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.description !== undefined) updateData.description = body.description;

  if (body.category_id !== undefined) {
    if (body.category_id === null) {
      // jika ingin menghapus relasi (jika schema mengizinkan null)
      updateData.category_id = null;
    } else {
      // validasi keberadaan category sebelum assign -> mencegah P2003
      const cat = await prisma.category.findUnique({
        where: { id: body.category_id },
      });
      if (!cat) {
        return NextResponse.json(
          { message: `Category with id '${body.category_id}' not found` },
          { status: 400 }
        );
      }
      updateData.category_id = body.category_id;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { message: "No updatable fields provided" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true }, // optional
    });

    // serialisasi amount (Prisma Decimal -> number)
    const amountAny = updated.amount;
    const amountNumber = amountAny?.toNumber
      ? amountAny.toNumber()
      : Number(amountAny);

    return NextResponse.json(
      { ...updated, amount: amountNumber },
      { status: 200 }
    );
  } catch (err) {
    console.error(`PUT /api/transactions/[id] error:`, err);
    if (err?.code === "P2025") {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  try {
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    console.error(`DELETE /api/transactions/[id] error:`, err);
    if (err?.code === "P2025") {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
