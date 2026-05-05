import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse counts from body (sent by Settings tab)
  let counts;
  try {
    const body = await req.json();
    counts = body.counts;
  } catch { /* no body */ }

  const baseUrl = process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3003");

  const res = await fetch(`${baseUrl}/api/schedule`, {
    method: "POST",
    headers: {
      "x-schedule-secret": process.env.JWT_SECRET ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ counts }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
