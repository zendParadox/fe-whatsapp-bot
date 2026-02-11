/* eslint-disable */
// src/app/api/transactions/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type UpdatePayload = {
  amount?: number;
  type?: "INCOME" | "EXPENSE";
  description?: string | null;
  category_id?: string | null;
  created_at?: string; // ISO date string
};

async function resolveParams(
  paramsOrPromise: { id: string } | Promise<{ id: string }>
) {
  // jika params adalah Promise, await; kalau bukan, langsung return
  return (paramsOrPromise as any)?.then
    ? await (paramsOrPromise as Promise<{ id: string }>)
    : (paramsOrPromise as { id: string });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved = await resolveParams(context.params);
  const id = resolved?.id;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as UpdatePayload;

  const updateData: Record<string, any> = {};
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.created_at !== undefined) updateData.created_at = new Date(body.created_at);

  if (body.category_id !== undefined) {
    if (body.category_id === null) {
      updateData.category_id = null;
    } else {
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
      include: { category: true },
    });

    const amountAny = updated.amount;
    const amountNumber = amountAny?.toNumber
      ? amountAny.toNumber()
      : Number(amountAny);

    return NextResponse.json(
      { ...updated, amount: amountNumber },
      { status: 200 }
    );
  } catch (err: any) {
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
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved = await resolveParams(context.params);
  const id = resolved?.id;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  try {
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err: any) {
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
