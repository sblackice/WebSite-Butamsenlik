"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, hashPassword, safeNext, verifyPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { randomToken, sha256 } from "@/lib/crypto";
import { sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, firstError, passwordSchema, phoneSchema } from "@/lib/validation";

export type AuthState = { ok: boolean; message: string; fields?: Record<string, string>; email?: string; values?: Record<string, string> } | null;

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

// A real bcrypt hash of a random string, so unknown e-mails take as long as wrong passwords.
const DUMMY_HASH = "$2b$12$q3eRGjEORqVI9oz4CtxF9eXWKGBzJpuxc5jnKC73vtp1Qmq4UCC1u";

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!rateLimit(`login:${await ip()}`, 10, 15 * 60_000) || !rateLimit(`login:${email}`, 8, 15 * 60_000)) {
    return { ok: false, message: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.", email };
  }
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.isActive) return { ok: false, message: "E-posta veya şifre hatalı.", email };

  await createSession(user.id);
  await mergeGuestCart(user.id);
  revalidatePath("/", "layout");
  redirect(user.role === "ADMIN" && next === "/hesabim" ? "/admin" : next);
}

const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Ad soyad yazın.").max(80),
    email: emailSchema,
    phone: z.union([z.literal(""), phoneSchema]).optional(),
    password: passwordSchema,
    password2: z.string(),
    terms: z.literal("on", { message: "Üyelik koşullarını ve aydınlatma metnini onaylayın." }),
    marketing: z.string().optional(),
  })
  .refine((v) => v.password === v.password2, { path: ["password2"], message: "Şifreler aynı değil." });

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!rateLimit(`register:${await ip()}`, 5, 60 * 60_000)) return { ok: false, message: "Çok fazla deneme. Daha sonra tekrar deneyin." };
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const e = firstError(parsed.error);
    return { ok: false, message: e.message, fields: e.fields, email: raw.email, values: { name: raw.name ?? "", phone: raw.phone ?? "" } };
  }
  const v = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: v.email } });
  if (exists) return { ok: false, message: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.", email: v.email, values: { name: v.name, phone: v.phone ?? "" } };

  const user = await prisma.user.create({
    data: { name: v.name, email: v.email, phone: v.phone || null, passwordHash: await hashPassword(v.password), marketingOk: v.marketing === "on" },
  });
  await createSession(user.id);
  await mergeGuestCart(user.id);
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

const GENERIC_RESET_MSG = "Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.";

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rateLimit(`reset:${await ip()}`, 5, 60 * 60_000) || !rateLimit(`reset:${email}`, 3, 60 * 60_000)) {
    return { ok: false, message: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." };
  }
  if (!z.email().safeParse(email).success) return { ok: false, message: "Geçerli bir e-posta adresi yazın." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = randomToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
    const base = process.env.APP_URL || "http://localhost:3000";
    try {
      await sendMail({
        to: user.email,
        subject: "Butamsenlik şifre sıfırlama",
        text: `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için bu bağlantıyı 30 dakika içinde açın:\n${base}/sifre-sifirla?token=${token}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
      });
    } catch (e) {
      console.error("reset mail failed", e);
      return { ok: false, message: "E-posta şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin veya bizimle iletişime geçin." };
    }
  }
  return { ok: true, message: GENERIC_RESET_MSG };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  if (!rateLimit(`reset-confirm:${await ip()}`, 10, 15 * 60_000)) return { ok: false, message: "Çok fazla deneme. Daha sonra tekrar deneyin." };
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  if (password !== password2) return { ok: false, message: "Şifreler aynı değil." };

  const row = token ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } }) : null;
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, message: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama isteği gönderin." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: row.userId } }), // log out everywhere
  ]);
  return { ok: true, message: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." };
}

export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, dbUser.passwordHash))) return { ok: false, message: "Mevcut şifre hatalı." };
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  if (password !== String(formData.get("password2") ?? "")) return { ok: false, message: "Yeni şifreler aynı değil." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return { ok: true, message: "Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapatıldı." };
}
