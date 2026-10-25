import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { listProducts, METALS, parseFilters, SORTS, type ListingParams } from "@/lib/catalog";
import { getFavoriteIds } from "@/lib/favorites";
import { formatTRY, toTLInput } from "@/lib/money";
import { buildHref } from "@/lib/query";
import { Icon } from "./Icon";
import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Konum" className="text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link href="/" className="hover:underline">Ana sayfa</Link></li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            <Icon name="chevron" size={14} />
            {c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export async function Listing({
  title,
  description,
  crumbs,
  path,
  where,
  searchParams,
  subLinks,
  hideOnSaleFilter = false,
}: {
  title: string;
  description?: string | null;
  crumbs: Crumb[];
  path: string;
  where: Prisma.ProductWhereInput;
  searchParams: ListingParams;
  subLinks?: { label: string; href: string; active?: boolean }[];
  hideOnSaleFilter?: boolean;
}) {
  const f = parseFilters(searchParams);
  const [{ products, total, pages, priceRange }, favs] = await Promise.all([listProducts(where, f), getFavoriteIds()]);

  // Current params as plain strings (page reset when filters change).
  const current: Record<string, string | string[] | undefined> = {
    q: f.q || undefined,
    min: searchParams.min || undefined,
    max: searchParams.max || undefined,
    stok: f.inStock ? "1" : undefined,
    metal: f.metals.length ? f.metals : undefined,
    indirim: f.onSale ? "1" : undefined,
    sirala: f.sort !== "onerilen" ? f.sort : undefined,
  };

  const chips: { label: string; href: string }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, href: buildHref(path, current, { q: undefined }) });
  if (f.min != null) chips.push({ label: `En az ${formatTRY(f.min)}`, href: buildHref(path, current, { min: undefined }) });
  if (f.max != null) chips.push({ label: `En çok ${formatTRY(f.max)}`, href: buildHref(path, current, { max: undefined }) });
  if (f.inStock) chips.push({ label: "Stokta olanlar", href: buildHref(path, current, { stok: undefined }) });
  if (f.onSale) chips.push({ label: "İndirimli", href: buildHref(path, current, { indirim: undefined }) });
  for (const m of f.metals) chips.push({ label: METALS[m], href: buildHref(path, current, { metal: f.metals.filter((x) => x !== m) }) });

  const filterForm = (pfx: string) => (
    <form action={path} className="grid gap-6" aria-label="Filtreler">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      {current.sirala && <input type="hidden" name="sirala" value={current.sirala as string} />}
      <fieldset className="grid gap-2">
        <legend className="label mb-1">Fiyat aralığı (TL)</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${pfx}-min`}>En az</label>
          <input id={`${pfx}-min`} name="min" inputMode="decimal" placeholder={toTLInput(priceRange.min).split(",")[0]} defaultValue={searchParams.min ?? ""} className="input" />
          <span aria-hidden>–</span>
          <label className="sr-only" htmlFor={`${pfx}-max`}>En çok</label>
          <input id={`${pfx}-max`} name="max" inputMode="decimal" placeholder={toTLInput(priceRange.max).split(",")[0]} defaultValue={searchParams.max ?? ""} className="input" />
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="label mb-1">Renk / malzeme</legend>
        {Object.entries(METALS).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="metal" value={k} defaultChecked={f.metals.includes(k)} className="checkbox" />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="label mb-1">Durum</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stok" value="1" defaultChecked={f.inStock} className="checkbox" />
          Sadece stokta olanlar
        </label>
        {!hideOnSaleFilter && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="indirim" value="1" defaultChecked={f.onSale} className="checkbox" />
            İndirimli ürünler
          </label>
        )}
      </fieldset>
      <button type="submit" className="btn btn-primary btn-block">Filtrele</button>
    </form>
  );

  return (
    <div className="container-x pt-5">
      <Breadcrumbs items={crumbs} />
      <header className="mt-3 grid gap-2">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-ink-soft">{description}</p>}
      </header>

      {subLinks && subLinks.length > 0 && (
        <nav aria-label="Alt kategoriler" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {subLinks.map((s) => (
            <Link key={s.href} href={s.href} aria-current={s.active ? "page" : undefined} className={`chip shrink-0 ${s.active ? "border-ink bg-ink text-ground" : "hover:border-ink"}`}>
              {s.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filterForm("fd")}</aside>

        <section aria-label="Ürünler">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" role="status">{total} ürün</p>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="btn btn-outline btn-sm list-none">
                  <Icon name="filter" size={18} /> Filtrele{chips.length ? ` (${chips.length})` : ""}
                </summary>
                <div className="card absolute right-0 z-30 mt-2 w-[min(88vw,340px)] p-4 shadow-xl">{filterForm("fm")}</div>
              </details>
              <form action={path} className="flex items-center gap-2">
                {Object.entries(current).map(([k, v]) =>
                  k === "sirala" || v == null ? null : Array.isArray(v) ? v.map((x) => <input key={k + x} type="hidden" name={k} value={x} />) : <input key={k} type="hidden" name={k} value={v} />,
                )}
                <SortSelect value={f.sort} options={SORTS} />
              </form>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Aktif filtreler">
              {chips.map((c) => (
                <Link key={c.label} href={c.href} className="chip hover:border-ink" aria-label={`${c.label} filtresini kaldır`}>
                  {c.label} <Icon name="close" size={14} />
                </Link>
              ))}
              <Link href={buildHref(path, f.q && path === "/arama" ? { q: f.q } : {})} className="text-sm font-semibold underline underline-offset-4">
                Tümünü temizle
              </Link>
            </div>
          )}

          {products.length ? (
            <ProductGrid products={products} favoriteIds={favs} back={buildHref(path, current, { sayfa: f.page > 1 ? String(f.page) : undefined })} />
          ) : (
            <div className="card grid place-items-center gap-3 p-10 text-center">
              <p className="font-display text-3xl">Ürün bulunamadı</p>
              <p className="text-ink-soft">Filtreleri değiştirmeyi veya temizlemeyi deneyin.</p>
              <Link href={path} className="btn btn-outline">Filtreleri temizle</Link>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Sayfalar" className="mt-10 flex flex-wrap items-center justify-center gap-1">
              {f.page > 1 && <Link className="btn btn-ghost btn-sm" href={buildHref(path, current, { sayfa: String(f.page - 1) })} rel="prev">Önceki</Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={buildHref(path, current, { sayfa: n > 1 ? String(n) : undefined })}
                  aria-current={n === f.page ? "page" : undefined}
                  className={`grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm ${n === f.page ? "bg-ink text-ground" : "hover:bg-sand"}`}
                >
                  {n}
                </Link>
              ))}
              {f.page < pages && <Link className="btn btn-ghost btn-sm" href={buildHref(path, current, { sayfa: String(f.page + 1) })} rel="next">Sonraki</Link>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
