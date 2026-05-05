import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Read .env manually to ensure env vars are available even when Next.js
// dotenv loading has issues on Windows
function loadEnvFallback(): Record<string, string> {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    const result: Record<string, string> = {};
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/);
      if (m) result[m[1]] = m[2];
    }
    return result;
  } catch {
    return {};
  }
}

const envFallback = loadEnvFallback();

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || envFallback.ANTHROPIC_API_KEY || "",
    JWT_SECRET: process.env.JWT_SECRET || envFallback.JWT_SECRET || "bbc-dashboard-secret-change-in-production-2026",
  },
};

export default nextConfig;
