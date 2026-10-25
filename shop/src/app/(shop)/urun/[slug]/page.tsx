import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/BuyBox";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Gallery } from "@/components/Gallery";
import { Icon } from "@/components/Icon";
import { Breadcrumbs } from "@/components/Listing";
import { ProductCard } from "@/components/ProductCard";
import { cardInclude, productStock } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favorites";
import { formatTRY } from "@/lib/money";
import { getSettings, shippingRule } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: "Ürün bulunamadı" };
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: p.images[0] ? [{ url: p.images[0].url }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();

  const [related, favs, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, id: { not: p.id }, OR: [{ categoryId: p.categoryId }, ...(p.category.parentId ? [{ category: { parentId: p.category.parentId } }] : [])] },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: cardInclude,
    }),
    getFavoriteIds(),
    getSettings(),
  ]);
  const stock = productStock(p);
  const free = shippingRule(settings).freeThreshold;
  const crumbs = [
    ...(p.category.parent ? [{ label: p.category.parent.name, href: `/kategori/${p.category.parent.slug}` }] : []),
    { label: p.category.name, href: `/kategori/${p.category.slug}` },
    { label: p.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.sku ?? undefined,
    image: p.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: (p.price / 100).toFixed(2),
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-x pb-28 pt-5 md:pb-0">
      <Breadcrumbs items={crumbs} />
      <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
        <Gallery images={p.images.map((i) => ({ url: i.url, alt: i.alt }))} name={p.name} />

        <div className="grid content-start gap-6">
          <div className="grid gap-2">
            {p.isDemo && <span className="badge w-fit bg-warning-soft text-[#6a4b12]">Demo ürün</span>}
            <h1 className="text-4xl md:text-5xl">{p.name}</h1>
            {p.sku && <p className="text-xs text-ink-soft">Ürün kodu: {p.sku}</p>}
          </div>

          <BuyBox
            productId={p.id}
            price={p.price}
            compareAt={p.compareAtPrice}
            stock={p.stock}
            variants={p.variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock, priceDelta: v.priceDelta }))}
            personalization={p.personalization}
            personalizationLabel={p.personalizationLabel}
            personalizationMax={p.personalizationMax}
          />

          <FavoriteButton productId={p.id} active={favs.has(p.id)} back={`/urun/${p.slug}`} withText />

          <ul className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-paper p-4 text-sm">
            <li className="flex gap-3"><span className="text-gold-deep"><Icon name="truck" /></span><span>{free > 0 ? `${formatTRY(free)} ve üzeri siparişlerde ücretsiz kargo. ` : ""}{settings.shippingInfo} <Link href="/sayfa/kargo-ve-teslimat" className="underline">Ayrıntılar</Link></span></li>
            <li className="flex gap-3"><span className="text-gold-deep"><Icon name="refresh" /></span><span>{settings.returnInfo} <Link href="/sayfa/iade-ve-degisim" className="underline">İade koşulları</Link></span></li>
          </ul>

          <div className="grid gap-3">
            <details open className="border-b border-line pb-3">
              <summary className="cursor-pointer py-2 font-semibold">Ürün açıklaması</summary>
              <p className="whitespace-pre-line text-ink-soft">{p.description}</p>
            </details>
            {p.details && (
              <details className="border-b border-line pb-3">
                <summary className="cursor-pointer py-2 font-semibold">Özellikler</summary>
                <ul className="grid gap-1 text-ink-soft">
                  {p.details.split("\n").filter(Boolean).map((d, i) => <li key={i}>• {d}</li>)}
                </ul>
              </details>
            )}
            <details className="border-b border-line pb-3">
              <summary className="cursor-pointer py-2 font-semibold">Bakım önerileri</summary>
              <p className="text-ink-soft">Bakım bilgisi ürünün gerçek malzemesine göre işletme tarafından yazılmalıdır.</p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="mb-5 text-3xl">Bunlar da hoşuna gidebilir</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
            {related.map((r) => <li key={r.id}><ProductCard product={r} isFavorite={favs.has(r.id)} back={`/urun/${p.slug}`} /></li>)}
          </ul>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
