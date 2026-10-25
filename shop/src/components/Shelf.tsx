import Link from "next/link";
import type { CardProduct } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function Shelf({
  title,
  eyebrow,
  href,
  products,
  favoriteIds,
}: {
  title: string;
  eyebrow?: string;
  href: string;
  products: CardProduct[];
  favoriteIds: Set<string>;
}) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-16 md:mt-24" aria-labelledby={`shelf-${title.length}-${products[0].id}`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 id={`shelf-${title.length}-${products[0].id}`} className="text-3xl md:text-4xl">{title}</h2>
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-gold-deep">
          Tümünü gör
        </Link>
      </div>
      <ul className="scroll-row">
        {products.map((p) => (
          <li key={p.id}><ProductCard product={p} isFavorite={favoriteIds.has(p.id)} back="/" /></li>
        ))}
      </ul>
    </section>
  );
}
