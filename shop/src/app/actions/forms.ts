"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { ok: boolean; message: string; values?: Record<string, string> } | null;

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!rateLimit(await clientKey("newsletter"), 5, 60_000)) return { ok: false, message: "Çok fazla deneme. Biraz sonra tekrar deneyin." };
  const email = z.email().max(120).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { ok: false, message: "Geçerli bir e-posta adresi yazın." };
  if (formData.get("consent") !== "on") return { ok: false, message: "Devam etmek için onay kutusunu işaretleyin." };
  await prisma.newsletterSubscriber.upsert({ where: { email: email.data }, update: {}, create: { email: email.data } });
  return { ok: true, message: "Teşekkürler, bültene kaydoldunuz." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Adınızı yazın.").max(80),
  email: z.email("Geçerli bir e-posta yazın.").max(120),
  subject: z.string().trim().min(2, "Konu yazın.").max(120),
  message: z.string().trim().min(10, "Mesajınız en az 10 karakter olmalı.").max(3000),
});

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!rateLimit(await clientKey("contact"), 3, 10 * 60_000)) return { ok: false, message: "Çok fazla mesaj gönderildi. Lütfen daha sonra deneyin." };
  const raw = Object.fromEntries([...formData.entries()].filter(([, x]) => typeof x === "string")) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", subject: raw.subject ?? "", message: raw.message ?? "" };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Formu kontrol edin.", values };
  if (formData.get("consent") !== "on") return { ok: false, message: "Aydınlatma metnini okuduğunuzu onaylayın.", values };
  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Mesajınız alındı. En kısa sürede dönüş yapılacaktır." };
}
