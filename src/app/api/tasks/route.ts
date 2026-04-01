import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, status, priority, assigneeId, dueDate } = await req.json();
  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? "",
      status: status ?? "todo",
      priority: priority ?? "medium",
      assigneeId: assigneeId ?? null,
      creatorId: session.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ task }, { status: 201 });
}
