import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const ideas = await prisma.idea.findMany({
    where: category ? { category } : {},
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ ideas });
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, title, body } = await req.json();
  const idea = await prisma.idea.create({ data: { category, title, body } });
  return NextResponse.json({ idea }, { status: 201 });
}
