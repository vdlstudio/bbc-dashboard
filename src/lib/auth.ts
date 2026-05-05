import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
// Note: prisma import is done dynamically to avoid Edge Runtime issues


const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret"
);

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function createToken(session: Session): Promise<string> {
  return new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("bbc_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getUserById(id: string) {
  const { prisma } = await import("./db");
  return prisma.user.findUnique({ where: { id } });
}
