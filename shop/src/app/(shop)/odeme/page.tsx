import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { OrderSummary } from "@/components/OrderSummary";
import { getCurrentUser } from "@/lib/auth";
import { cartSummary, findCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { availablePaymentMethods } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, user, settings] = await Promise.all([findCart(), getCurrentUser(), getSettings()]);
  const { lines, totals, hasIssues } = await cartSummary(cart);
  if (!lines.length || hasIssues) redirect("/sepet");

  const addresses = user ? await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { title: "asc" }] }) : [];
  const def = addresses[0];
  const defaults: Record<string, string> = {
    email: user?.email ?? "",
    phone: def?.phone ?? user?.phone ?? "",
    fullName: def?.fullName ?? user?.name ?? "",
    city: def?.city ?? "",
    district: def?.district ?? "",
    line: def?.line ?? "",
    postalCode: def?.postalCode ?? "",
  };

  return (
    <div className="container-x pt-6">
      <h1 className="text-4xl md:text-5xl">Siparişi tamamla</h1>
      {!user && (
        <p className="mt-2 text-sm text-ink-soft">
          Üye olmadan devam edebilirsiniz. Üyeyseniz <Link href="/giris?next=/odeme" className="underline">giriş yapın</Link>.
        </p>
      )}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <CheckoutForm defaults={defaults} addresses={addresses} methods={availablePaymentMethods(settings)} />
        <div className="grid content-start gap-4 lg:sticky lg:top-40">
          <OrderSummary totals={totals}>
            <ul className="grid gap-2 border-t border-line pt-3 text-sm">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span>{l.quantity} × {l.name}{l.variantName ? ` (${l.variantName})` : ""}{l.personalization ? ` – ${l.personalization}` : ""}</span>
                  <span className="shrink-0">{formatTRY(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <Link href="/sepet" className="text-center text-sm underline">Sepeti düzenle</Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
