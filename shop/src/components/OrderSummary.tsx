import type { Totals } from "@/lib/pricing";
import { formatTRY } from "@/lib/money";

export function OrderSummary({ totals, children }: { totals: Totals; children?: React.ReactNode }) {
  return (
    <div className="card grid gap-4 p-5">
      <h2 className="text-2xl">Sipariş özeti</h2>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between"><dt>Ara toplam</dt><dd>{formatTRY(totals.subtotal)}</dd></div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-success"><dt>İndirim{totals.couponCode ? ` (${totals.couponCode})` : ""}</dt><dd>−{formatTRY(totals.discount)}</dd></div>
        )}
        <div className="flex justify-between"><dt>Kargo</dt><dd>{totals.shippingFee === 0 ? "Ücretsiz" : formatTRY(totals.shippingFee)}</dd></div>
        <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-bold"><dt>Toplam</dt><dd>{formatTRY(totals.total)}</dd></div>
      </dl>
      {totals.amountToFreeShipping > 0 && (
        <p className="rounded-lg bg-sand px-3 py-2 text-sm">
          Ücretsiz kargo için <strong>{formatTRY(totals.amountToFreeShipping)}</strong> daha ekleyin.
        </p>
      )}
      {children}
    </div>
  );
}
