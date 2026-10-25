"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, safeNext } from "@/lib/auth";

export async function toggleFavorite(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const back = safeNext(formData.get("back"), "/");
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(back)}`);
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (product) await prisma.favorite.create({ data: { userId: user.id, productId } });
  }
  revalidatePath("/", "layout");
}
