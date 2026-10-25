import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "bts_session";
const SESSION_DAYS = 30;

export type CurrentUser = { id: string; email: string; name: string; phone: string | null; role: string };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** The logged-in user for this request, or null. Checked on the server on every call. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const { id, email, name, phone, role } = session.user;
  return { id, email, name, phone, role };
});

export async function requireUser(next = "/hesabim"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(next)}`);
  return user;
}

/** Use at the top of every admin page AND every admin server action. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Only allow relative in-site redirects after login (prevents open redirects). */
export function safeNext(next: unknown, fallback = "/hesabim"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
