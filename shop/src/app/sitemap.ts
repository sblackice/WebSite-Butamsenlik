import type { MetadataRoute } from "next";
import { PAGES } from "@/content/pages";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const [cats, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: `${base}/` },
    { url: `${base}/urunler` },
    ...cats.map((c) => ({ url: `${base}/kategori/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/urun/${p.slug}`, lastModified: p.updatedAt })),
    ...Object.keys(PAGES).map((s) => ({ url: `${base}/sayfa/${s}` })),
  ];
}
