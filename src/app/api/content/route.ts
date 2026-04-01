import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = type ? { type } : {};
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.content.count({ where }),
  ]);

  // Check favorites for current user
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId, contentId: { in: items.map((i) => i.id) } },
  });
  const favSet = new Set(favorites.map((f) => f.contentId));

  return NextResponse.json({
    items: items.map((i) => ({ ...i, isFavorite: favSet.has(i.id) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.content.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
