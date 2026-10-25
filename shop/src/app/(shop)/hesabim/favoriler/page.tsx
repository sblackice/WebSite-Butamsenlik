import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { requireUser } from "@/lib/auth";
import { cardInclude } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/hesabim/favoriler");
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: cardInclude } },
  });
  return (
    <div className="grid gap-4">
      <h2 className="text-3xl">Favorilerim</h2>
      {favs.length === 0 ? (
        <p className="text-ink-soft">Favori ürününüz yok. Ürünlerdeki kalp simgesine dokunarak ekleyebilirsiniz. <Link href="/urunler" className="underline">Ürünlere göz at</Link></p>
      ) : (
        <ProductGrid products={favs.map((f) => f.product)} favoriteIds={new Set(favs.map((f) => f.productId))} back="/hesabim/favoriler" />
      )}
    </div>
  );
}
