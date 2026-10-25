/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { Shelf } from "@/components/Shelf";
import { cardInclude, getCategoryTree, homeShelves } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favorites";
import { formatTRY } from "@/lib/money";
import { getSettings, shippingRule } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, cats, shelves, collections, favs, settings] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getCategoryTree(),
    homeShelves(),
    prisma.collection.findMany({
      where: { isFeatured: true },
      orderBy: { sortOrder: "asc" },
      include: { products: { orderBy: { sortOrder: "asc" }, take: 4, where: { product: { isActive: true } }, include: { product: { include: cardInclude } } } },
    }),
    getFavoriteIds(),
    getSettings(),
  ]);

  const hero = banners.filter((b) => b.placement === "HERO");
  const promo = banners.find((b) => b.placement === "PROMO");
  const [main, ...side] = hero;

  // One representative image per top category (first active product in it or its children).
  const catImages = await Promise.all(
    cats.map((c) =>
      prisma.productImage.findFirst({
        where: { product: { isActive: true, category: { OR: [{ id: c.id }, { parentId: c.id }] } } },
        orderBy: [{ product: { isFeatured: "desc" } }, { sortOrder: "asc" }],
      }),
    ),
  );

  const free = shippingRule(settings).freeThreshold;
  const trust: { icon: IconName; title: string; text: string; href: string }[] = [
    { icon: "truck", title: free > 0 ? `${formatTRY(free)} üzeri ücretsiz kargo` : "Kargo bilgisi", text: "Kargo ve teslimat koşulları", href: "/sayfa/kargo-ve-teslimat" },
    { icon: "gift", title: "Kişiye özel takılar", text: "Harf ve isim seçenekleri", href: "/kategori/kisiye-ozel" },
    { icon: "refresh", title: "İade ve değişim", text: "Koşulları inceleyin", href: "/sayfa/iade-ve-degisim" },
    { icon: "chat", title: "Müşteri desteği", text: "Bize yazın", href: "/sayfa/iletisim" },
  ];

  return (
    <>
      <h1 className="sr-only">Butamsenlik takı ve aksesuar</h1>

      {main && (
        <section className="container-x mt-4 grid gap-3 md:mt-6 md:grid-cols-[1.6fr_1fr] md:gap-5" aria-label="Öne çıkanlar">
          <Link href={main.ctaHref || "/urunler"} className={`tone-${main.tone} group relative grid overflow-hidden rounded-[var(--radius-card)] md:min-h-[460px] md:grid-cols-2`}>
            <div className="relative z-10 flex flex-col justify-center gap-3 p-6 md:p-10">
              {main.eyebrow && <p className="eyebrow">{main.eyebrow}</p>}
              <p className="font-display text-5xl font-semibold leading-[0.95] md:text-7xl">{main.title}</p>
              {main.subtitle && <p className="max-w-sm text-ink-soft">{main.subtitle}</p>}
              {main.ctaLabel && <span className="btn btn-primary mt-2 w-fit">{main.ctaLabel}</span>}
            </div>
            {main.imageUrl && (
              <img src={main.imageUrl} alt="" className="h-56 w-full object-cover md:h-full" loading="eager" width={800} height={800} />
            )}
          </Link>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-5">
            {side.slice(0, 2).map((b) => (
              <Link key={b.id} href={b.ctaHref || "/urunler"} className={`tone-${b.tone} relative flex min-h-[170px] overflow-hidden rounded-[var(--radius-card)]`}>
                <div className="relative z-10 flex flex-col justify-end gap-1 p-4 md:p-6">
                  {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
                  <p className="font-display text-2xl font-semibold leading-tight md:text-3xl">{b.title}</p>
                  {b.ctaLabel && <span className="text-sm font-semibold underline underline-offset-4">{b.ctaLabel}</span>}
                </div>
                {b.imageUrl && <img src={b.imageUrl} alt="" className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-90 md:block" loading="lazy" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-x mt-6" aria-label="Alışveriş bilgileri">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {trust.map((t) => (
            <li key={t.title}>
              <Link href={t.href} className="flex h-full items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-ink md:p-4">
                <span className="text-gold-deep"><Icon name={t.icon} size={26} /></span>
                <span className="grid">
                  <span className="text-sm font-semibold leading-tight">{t.title}</span>
                  <span className="text-xs text-ink-soft">{t.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-16 md:mt-24" aria-labelledby="cats-title">
        <h2 id="cats-title" className="mb-5 text-3xl md:text-4xl">Kategoriler</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-5">
          {cats.map((c, i) => (
            <li key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-sand">
                  {catImages[i] && (
                    <img src={catImages[i]!.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <p className="mt-2 flex items-center justify-between font-display text-2xl font-semibold">
                  {c.name}
                  <Icon name="chevron" size={18} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Shelf eyebrow="Yeni" title="Yeni gelenler" href="/urunler?sirala=yeni" products={shelves.newest} favoriteIds={favs} />

      {collections.map((col) => (
        <section key={col.id} className="container-x mt-16 md:mt-24" aria-labelledby={`col-${col.id}`}>
          <div className={`tone-${col.tone} grid gap-6 rounded-[var(--radius-card)] p-5 md:grid-cols-[1fr_3fr] md:p-8`}>
            <div className="flex flex-col justify-center gap-3">
              <p className="eyebrow">Koleksiyon</p>
              <h2 id={`col-${col.id}`} className="text-4xl md:text-5xl">{col.name}</h2>
              {col.description && <p className="text-ink-soft">{col.description}</p>}
              <Link href={`/koleksiyon/${col.slug}`} className="btn btn-primary mt-1 w-fit">Koleksiyonu gör</Link>
            </div>
            <ul className="scroll-row md:grid md:grid-flow-row md:grid-cols-4">
              {col.products.map(({ product }) => (
                <li key={product.id}><ProductCard product={product} isFavorite={favs.has(product.id)} /></li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {promo && (
        <section className="container-x mt-16 md:mt-24">
          <Link href={promo.ctaHref || "/urunler"} className={`tone-${promo.tone} flex flex-col items-start gap-3 rounded-[var(--radius-card)] p-6 md:flex-row md:items-center md:justify-between md:p-10`}>
            <div>
              {promo.eyebrow && <p className="eyebrow mb-1">{promo.eyebrow}</p>}
              <p className="font-display text-3xl font-semibold md:text-4xl">{promo.title}</p>
              {promo.subtitle && <p className="mt-1 text-sm text-ink-soft">{promo.subtitle}</p>}
            </div>
            {promo.ctaLabel && <span className="btn btn-primary">{promo.ctaLabel}</span>}
          </Link>
        </section>
      )}

      <Shelf eyebrow="Kampanya" title="İndirimdeki ürünler" href="/urunler?indirim=1" products={shelves.onSale} favoriteIds={favs} />
      <Shelf eyebrow="Popüler" title="Çok satanlar" href="/urunler?sirala=cok-satan" products={shelves.bestsellers} favoriteIds={favs} />

      <section className="container-x mt-16 md:mt-24">
        <div className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-6 text-center md:p-14">
          <p className="eyebrow">Butamsenlik</p>
          <h2 className="text-5xl md:text-6xl">{settings.brandStoryTitle}</h2>
          <p className="mx-auto max-w-xl text-ink-soft">{settings.brandStoryText}</p>
          <Link href="/sayfa/hakkimizda" className="mx-auto text-sm font-semibold underline underline-offset-4">Hikâyemiz</Link>
        </div>
      </section>
    </>
  );
}
