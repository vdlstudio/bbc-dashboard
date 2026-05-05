import { NextRequest, NextResponse } from "next/server";

// One-time setup endpoint: pushes the Prisma schema and seeds the DB.
// Call this once after deploying to a fresh database.
// Protected by a secret token to prevent abuse.
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: "" }));
  const expected = process.env.SETUP_TOKEN || "bbc-setup-2026";
  if (token !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { execSync } = await import("child_process");

    // Push schema to database
    execSync("npx prisma db push --skip-generate", {
      env: { ...process.env },
      stdio: "pipe",
    });

    // Seed the database
    execSync("node prisma/seed-prod.js", {
      env: { ...process.env },
      stdio: "pipe",
    });

    return NextResponse.json({ ok: true, message: "Database initialized and seeded successfully." });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({
      error: "Setup failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "BBC Dashboard Setup Endpoint",
    usage: "POST with { \"token\": \"bbc-setup-2026\" } to initialize the database"
  });
}
