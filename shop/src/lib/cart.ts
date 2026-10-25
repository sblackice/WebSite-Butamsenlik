import "server-only";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";
import { computeTotals, type CouponRule } from "./pricing";
import { getSettings, shippingRule } from "./settings";

export const CART_COOKIE = "bts_cart";
export const MAX_QTY_PER_LINE = 20;

const cartInclude = {
  items: {
    orderBy: { id: "asc" },
    include: {
      variant: true,
      product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true } },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/** Read-only lookup, safe to call from server components. */
export async function findCart(): Promise<CartWithItems | null> {
  const user = await getCurrentUser();
  if (user) {
    return prisma.cart.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: cartInclude });
  }
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  return prisma.cart.findFirst({ where: { id, userId: null }, include: cartInclude });
}

/** Only call from server actions (may set a cookie). */
export async function getOrCreateCart(): Promise<CartWithItems> {
  const existing = await findCart();
  if (existing) return existing;
  const user = await getCurrentUser();
  const cart = await prisma.cart.create({ data: { userId: user?.id ?? null }, include: cartInclude });
  if (!user) {
    (await cookies()).set(CART_COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return cart;
}

/** After login: move guest cart items into the user's cart. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!guestId) return;
  const guest = await prisma.cart.findFirst({ where: { id: guestId, userId: null }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!guest || guest.items.length === 0) {
    if (guest) await prisma.cart.delete({ where: { id: guest.id } });
    return;
  }
  const userCart =
    (await prisma.cart.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" }, include: { items: true } })) ??
    (await prisma.cart.create({ data: { userId }, include: { items: true } }));

  for (const item of guest.items) {
    const same = userCart.items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId && i.personalization === item.personalization,
    );
    if (same) {
      await prisma.cartItem.update({
        where: { id: same.id },
        data: { quantity: Math.min(MAX_QTY_PER_LINE, same.quantity + item.quantity) },
      });
    } else {
      await prisma.cartItem.update({ where: { id: item.id }, data: { cartId: userCart.id } });
    }
  }
  if (!userCart.couponCode && guest.couponCode) {
    await prisma.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
  }
  await prisma.cart.delete({ where: { id: guest.id } });
}

export type CartLine = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantName: string | null;
  personalization: string;
  image: { url: string; alt: string } | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  available: number;
  issue: string | null;
};

export function toLines(cart: CartWithItems | null): CartLine[] {
  if (!cart) return [];
  return cart.items.map((item) => {
    const p = item.product;
    const unitPrice = p.price + (item.variant?.priceDelta ?? 0);
    const available = item.variant ? item.variant.stock : p.stock;
    let issue: string | null = null;
    if (!p.isActive) issue = "Bu ürün satıştan kaldırıldı.";
    else if (p.variants.length > 0 && !item.variant) issue = "Seçenek seçilmemiş.";
    else if (available <= 0) issue = "Tükendi.";
    else if (item.quantity > available) issue = `Stokta yalnızca ${available} adet var.`;
    return {
      id: item.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantId: item.variantId,
      variantName: item.variant?.name ?? null,
      personalization: item.personalization,
      image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt || p.name } : null,
      unitPrice,
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice + (item.variant?.priceDelta ?? 0) : null,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      available,
      issue,
    };
  });
}

export async function loadCoupon(code: string | null | undefined): Promise<CouponRule | null> {
  if (!code) return null;
  const c = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c) return null;
  return { ...c, type: c.type === "FIXED" ? "FIXED" : "PERCENT" };
}

export async function cartSummary(cart: CartWithItems | null) {
  const lines = toLines(cart);
  const settings = await getSettings();
  const coupon = await loadCoupon(cart?.couponCode);
  const totals = computeTotals(
    lines.filter((l) => !l.issue || l.issue.startsWith("Stokta")),
    coupon,
    shippingRule(settings),
  );
  if (cart?.couponCode && !coupon) totals.couponError = "Bu indirim kodu bulunamadı.";
  return { lines, totals, hasIssues: lines.some((l) => l.issue) };
}

export async function cartCount(): Promise<number> {
  const cart = await findCart();
  return cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;
}
