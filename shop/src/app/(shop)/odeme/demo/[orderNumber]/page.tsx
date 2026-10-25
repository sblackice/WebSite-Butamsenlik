import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { confirmDemoPayment } from "@/app/actions/demo-payment";
import { SubmitButton } from "@/components/SubmitButton";
import { formatTRY } from "@/lib/money";
import { getAccessibleOrder } from "@/lib/order-access";
import { isDemoPaymentEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Test ödemesi", robots: { index: false } };

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> };

export default async function DemoPaymentPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  if (!isDemoPaymentEnabled()) notFound();
  const order = await getAccessibleOrder(orderNumber, t);
  if (!order || order.paymentMethod !== "DEMO") notFound();
  if (order.status !== "PENDING_PAYMENT") redirect(`/siparis/${order.orderNumber}?t=${encodeURIComponent(order.accessKey)}`);

  return (
    <div className="container-x grid max-w-xl gap-6 py-12">
      <div className="rounded-2xl border-2 border-dashed border-gold bg-warning-soft p-6">
        <p className="eyebrow">Test ortamı</p>
        <h1 className="mt-1 text-4xl">Demo ödeme ekranı</h1>
        <p className="mt-3 text-sm">
          Bu ekran gerçek bir ödeme sağlayıcısı <strong>değildir</strong>. Kart bilgisi istenmez, para çekilmez ve sipariş
          <strong> test siparişi</strong> olarak kaydedilir. Gerçek satış için bir ödeme sağlayıcısı (ör. iyzico, PayTR) entegre edilmelidir.
        </p>
      </div>
      <dl className="card grid gap-2 p-5 text-sm">
        <div className="flex justify-between"><dt>Sipariş no</dt><dd className="font-semibold">{order.orderNumber}</dd></div>
        <div className="flex justify-between"><dt>Tutar</dt><dd className="font-semibold">{formatTRY(order.total)}</dd></div>
      </dl>
      <form action={confirmDemoPayment} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="orderNumber" value={order.orderNumber} />
        <input type="hidden" name="t" value={t ?? ""} />
        <SubmitButton name="decision" value="approve" className="btn btn-primary">Test ödemesini onayla</SubmitButton>
        <button name="decision" value="decline" type="submit" className="btn btn-outline">Ödemeyi reddet (test)</button>
      </form>
    </div>
  );
}
