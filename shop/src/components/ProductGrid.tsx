import type { CardProduct } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  favoriteIds,
  back,
}: {
  products: CardProduct[];
  favoriteIds: Set<string>;
  back: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} isFavorite={favoriteIds.has(p.id)} back={back} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
