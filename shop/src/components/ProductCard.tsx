import Link from "next/link";
import type { CardProduct } from "@/lib/catalog";
import { isNewProduct, productStock } from "@/lib/catalog";
import { discountPercent } from "@/lib/money";
import { FavoriteButton } from "./FavoriteButton";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({
  product,
  isFavorite = false,
  back = "/",
  priority = false,
}: {
  product: CardProduct;
  isFavorite?: boolean;
  back?: string;
  priority?: boolean;
}) {
  const stock = productStock(product);
  const pct = discountPercent(product.price, product.compareAtPrice);
  const isNew = isNewProduct(product.createdAt);
  const simple = product.variants.length === 0 && product.personalization === "NONE";
  const img = product.images[0];

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[var(--radius-card)]">
        <Link href={`/urun/${product.slug}`} aria-label={product.name} tabIndex={-1}>
          <ProductImage
            url={img?.url}
            alt={img?.alt || product.name}
            eager={priority}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {pct > 0 && <span className="badge bg-danger text-white">%{pct}</span>}
          {isNew && <span className="badge bg-ink text-ground">Yeni</span>}
          {stock <= 0 && <span className="badge bg-paper text-ink">Tükendi</span>}
          {product.personalization !== "NONE" && <span className="badge bg-gold-light text-ink">Kişiye özel</span>}
        </div>
        <FavoriteButton productId={product.id} active={isFavorite} back={back} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 pt-3">
        <h3 className="font-sans text-[0.95rem] font-semibold leading-snug tracking-normal">
          <Link href={`/urun/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAt={product.compareAtPrice} />
        {stock > 0 && stock <= 3 && <p className="text-xs font-semibold text-gold-deep">Son {stock} ürün</p>}
        <div className="mt-auto pt-2">
          {stock <= 0 ? (
            <Link href={`/urun/${product.slug}`} className="btn btn-ghost btn-sm btn-block mb-[1.35rem]">
              İncele
            </Link>
          ) : simple ? (
            <QuickAdd productId={product.id} name={product.name} />
          ) : (
            <Link href={`/urun/${product.slug}`} className="btn btn-outline btn-sm btn-block mb-[1.35rem]">
              Seçenekleri gör
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
