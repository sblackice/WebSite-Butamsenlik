"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addressSchema, firstError, phoneSchema } from "@/lib/validation";

export type AccountState = { ok: boolean; message: string; fields?: Record<string, string>; values?: Record<string, string> } | null;

const profileSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad yazın.").max(80),
  phone: z.union([z.literal(""), phoneSchema]),
  marketing: z.string().optional(),
});

export async function updateProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") ?? "", phone: formData.get("phone") ?? "", marketing: formData.get("marketing") ?? undefined });
  if (!parsed.success) return { ok: false, ...firstError(parsed.error) };
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null, marketingOk: parsed.data.marketing === "on" },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Bilgileriniz kaydedildi." };
}

const addressInput = addressSchema.extend({ title: z.string().trim().min(2, "Adres başlığı yazın (örn. Ev).").max(30), isDefault: z.string().optional() });

export async function saveAddress(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/hesabim/adresler");
  const id = String(formData.get("id") ?? "");
  const raw = Object.fromEntries([...formData.entries()].filter(([, x]) => typeof x === "string")) as Record<string, string>;
  const parsed = addressInput.safeParse(raw);
  if (!parsed.success) return { ok: false, ...firstError(parsed.error), values: raw };
  const { isDefault, ...data } = parsed.data;
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (!id && count >= 10) return { ok: false, message: "En fazla 10 adres kaydedebilirsiniz.", values: raw };
  const makeDefault = isDefault === "on" || count === 0;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) {
      const res = await tx.address.updateMany({ where: { id, userId: user.id }, data: { ...data, postalCode: data.postalCode || null, ...(makeDefault ? { isDefault: true } : {}) } });
      if (res.count !== 1) throw new Error("Adres bulunamadı.");
    } else {
      await tx.address.create({ data: { ...data, postalCode: data.postalCode || null, userId: user.id, isDefault: makeDefault } });
    }
  });
  revalidatePath("/hesabim/adresler");
  return { ok: true, message: "Adres kaydedildi." };
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser("/hesabim/adresler");
  await prisma.address.deleteMany({ where: { id: String(formData.get("id") ?? ""), userId: user.id } });
  revalidatePath("/hesabim/adresler");
}
