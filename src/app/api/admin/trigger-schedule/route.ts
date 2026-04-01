import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

// Admin-only route to trigger the schedule from the UI
export async function POST() {
  const session = await requireSession().catch(() => null);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call the schedule endpoint with the server-side secret
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3001";

  const res = await fetch(`${baseUrl}/api/schedule`, {
    method: "POST",
    headers: { "x-schedule-secret": process.env.JWT_SECRET ?? "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
