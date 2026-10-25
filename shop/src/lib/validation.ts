import { z } from "zod";

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^(\+90|0)?5\d{9}$/.test(v) || /^(\+90|0)?[2-4]\d{9}$/.test(v), "Geçerli bir telefon numarası yazın (örn. 05xx xxx xx xx).");

export const passwordSchema = z
  .string()
  .min(10, "Şifre en az 10 karakter olmalı.")
  .max(128, "Şifre çok uzun.")
  .refine((v) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v) && /\d/.test(v), "Şifre en az bir harf ve bir rakam içermeli.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta adresi yazın.").max(120));

const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, `En fazla ${max} karakter.`);

export const addressSchema = z.object({
  fullName: text(3, 80, "Ad soyad yazın."),
  phone: phoneSchema,
  city: text(2, 40, "İl yazın."),
  district: text(2, 60, "İlçe yazın."),
  line: text(10, 250, "Açık adres en az 10 karakter olmalı."),
  postalCode: z.string().trim().max(10).regex(/^\d{0,5}$/, "Posta kodu 5 haneli olmalı.").optional().or(z.literal("")),
});

export function firstError(err: z.ZodError): { message: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !fields[k]) fields[k] = i.message;
  }
  return { message: err.issues[0]?.message ?? "Formu kontrol edin.", fields };
}
