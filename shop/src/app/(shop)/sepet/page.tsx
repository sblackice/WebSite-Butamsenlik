import type { Metadata } from "next";
import Link from "next/link";
import { removeCartItem } from "@/app/actions/cart";
import { CouponForm, QuantityForm } from "@/components/CartControls";
import { OrderSummary } from "@/components/OrderSummary";
import { ProductImage } from "@/components/ProductImage";
import { cartSummary, findCart } from "@/lib/cart";
import { formatTRY } from "@/lib/money";

export const metadata: Metadata = { title: "Sepetim", robots: { index: false } };

export default async function CartPage() {
  const cart = await findCart();
  const { lines, totals, hasIssues } = await cartSummary(cart);

  if (!lines.length) {
    return (
      <div className="container-x grid place-items-center gap-4 py-24 text-center">
        <h1 className="text-5xl">Sepetiniz boş</h1>
        <p className="text-ink-soft">Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın.</p>
        <Link href="/urunler" className="btn btn-primary">Ürünleri keşfet</Link>
      </div>
    );
  }

  return (
    <div className="container-x pt-6">
      <h1 className="text-4xl md:text-5xl">Sepetim</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="grid content-start gap-4" aria-label="Sepetteki ürünler">
          {lines.map((l) => (
            <li key={l.id} className="card grid grid-cols-[88px_1fr] gap-4 p-3 sm:grid-cols-[110px_1fr]">
              <Link href={`/urun/${l.slug}`}><ProductImage url={l.image?.url} alt={l.image?.alt ?? l.name} showBadge={false} className="rounded-lg" /></Link>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/urun/${l.slug}`} className="font-semibold hover:underline">{l.name}</Link>
                    {l.variantName && <p className="text-sm text-ink-soft">{l.variantName}</p>}
                    {l.personalization && <p className="text-sm text-ink-soft">Kişiselleştirme: <strong>{l.personalization}</strong></p>}
                    <p className="text-sm text-ink-soft">Birim: {formatTRY(l.unitPrice)}</p>
                  </div>
                  <p className="font-bold">{formatTRY(l.lineTotal)}</p>
                </div>
                {l.issue && <p role="alert" className="text-sm font-semibold text-danger">{l.issue}</p>}
                <div className="flex items-center justify-between gap-2">
                  <QuantityForm itemId={l.id} quantity={l.quantity} max={l.available} />
                  <form action={removeCartItem}>
                    <input type="hidden" name="itemId" value={l.id} />
                    <button type="submit" className="btn btn-ghost btn-sm text-danger">Kaldır</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid content-start gap-4 lg:sticky lg:top-40">
          <OrderSummary totals={totals}>
            <CouponForm applied={totals.couponCode} error={totals.couponError} />
            {hasIssues ? (
              <p className="alert alert-error text-sm">Devam etmeden önce sepetteki uyarıları düzeltin.</p>
            ) : (
              <Link href="/odeme" className="btn btn-primary btn-block">Siparişi tamamla</Link>
            )}
            <Link href="/urunler" className="text-center text-sm underline">Alışverişe devam et</Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
