import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { normalizeSearch } from "./text";
import { parseTL } from "./money";

export const PER_PAGE = 12;

export const SORTS = {
  onerilen: "Önerilen",
  "fiyat-artan": "Fiyat: düşükten yükseğe",
  "fiyat-azalan": "Fiyat: yüksekten düşüğe",
  yeni: "En yeniler",
  eski: "En eskiler",
  "cok-satan": "Çok satanlar",
} as const;
export type SortKey = keyof typeof SORTS;

export const METALS: Record<string, string> = {
  altin: "Altın renk",
  rose: "Rose renk",
  gumus: "Gümüş renk",
  celik: "Çelik",
};

export const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  variants: { select: { id: true, stock: true } },
} satisfies Prisma.ProductInclude;

export type CardProduct = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ListingParams = {
  q?: string;
  min?: string;
  max?: string;
  stok?: string;
  metal?: string | string[];
  indirim?: string;
  sirala?: string;
  sayfa?: string;
};

export type ParsedFilters = {
  q: string;
  min: number | null;
  max: number | null;
  inStock: boolean;
  metals: string[];
  onSale: boolean;
  sort: SortKey;
  page: number;
};

export function parseFilters(sp: ListingParams): ParsedFilters {
  const metals = (Array.isArray(sp.metal) ? sp.metal : sp.metal ? [sp.metal] : []).filter((m) => m in METALS);
  const sort = (sp.sirala && sp.sirala in SORTS ? sp.sirala : "onerilen") as SortKey;
  const page = Math.max(1, Math.min(1000, parseInt(sp.sayfa ?? "1", 10) || 1));
  return {
    q: (sp.q ?? "").slice(0, 80).trim(),
    min: parseTL(sp.min),
    max: parseTL(sp.max),
    inStock: sp.stok === "1",
    metals,
    onSale: sp.indirim === "1",
    sort,
    page,
  };
}

export const inStockWhere: Prisma.ProductWhereInput = {
  OR: [{ variants: { none: {} }, stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 } } } }],
};

export const onSaleWhere: Prisma.ProductWhereInput = {
  compareAtPrice: { gt: prisma.product.fields.price },
};

function orderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "fiyat-artan":
      return [{ price: "asc" }];
    case "fiyat-azalan":
      return [{ price: "desc" }];
    case "yeni":
      return [{ createdAt: "desc" }];
    case "eski":
      return [{ createdAt: "asc" }];
    case "cok-satan":
      return [{ salesCount: "desc" }, { createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(base: Prisma.ProductWhereInput, f: ParsedFilters) {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }, base];
  if (f.q) {
    for (const word of normalizeSearch(f.q).split(" ").filter(Boolean).slice(0, 6)) {
      and.push({ searchText: { contains: word } });
    }
  }
  if (f.min != null) and.push({ price: { gte: f.min } });
  if (f.max != null) and.push({ price: { lte: f.max } });
  if (f.inStock) and.push(inStockWhere);
  if (f.metals.length) and.push({ metal: { in: f.metals } });
  if (f.onSale) and.push(onSaleWhere);
  const where: Prisma.ProductWhereInput = { AND: and };

  const [total, products, range] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderBy(f.sort),
      skip: (f.page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: cardInclude,
    }),
    prisma.product.aggregate({ where: { AND: [{ isActive: true }, base] }, _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    total,
    products,
    pages: Math.max(1, Math.ceil(total / PER_PAGE)),
    priceRange: { min: range._min.price ?? 0, max: range._max.price ?? 0 },
  };
}

const NEW_DAYS = 21;
export function isNewProduct(createdAt: Date | string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < NEW_DAYS * 864e5;
}

export function productStock(p: { stock: number; variants: { stock: number }[] }): number {
  return p.variants.length ? p.variants.reduce((n, v) => n + Math.max(0, v.stock), 0) : p.stock;
}

export const getCategoryTree = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { children: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
});

export async function homeShelves() {
  const active = { isActive: true };
  const [newest, bestsellers, onSale] = await Promise.all([
    prisma.product.findMany({ where: active, orderBy: { createdAt: "desc" }, take: 8, include: cardInclude }),
    // Only real (non-test) sales count; the shelf stays hidden until there are some.
    prisma.product.findMany({
      where: { ...active, salesCount: { gt: 0 } },
      orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: cardInclude,
    }),
    prisma.product.findMany({
      where: { ...active, ...onSaleWhere },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: cardInclude,
    }),
  ]);
  return { newest, bestsellers, onSale };
}
