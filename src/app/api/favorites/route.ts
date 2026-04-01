import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    include: { content: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites: favorites.map((f) => ({ ...f.content, isFavorite: true })) });
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentId } = await req.json();

  const existing = await prisma.favorite.findUnique({
    where: { userId_contentId: { userId: session.userId, contentId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFavorite: false });
  } else {
    await prisma.favorite.create({ data: { userId: session.userId, contentId } });
    return NextResponse.json({ isFavorite: true });
  }
}
