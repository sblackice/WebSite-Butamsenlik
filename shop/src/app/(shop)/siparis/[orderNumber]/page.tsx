import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/OrderDetail";
import { formatTRY } from "@/lib/money";
import { getAccessibleOrder } from "@/lib/order-access";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Sipariş", robots: { index: false } };

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const order = await getAccessibleOrder(orderNumber, t);
  if (!order) notFound();
  const s = await getSettings();

  return (
    <div className="container-x grid max-w-3xl gap-6 py-10">
      <div>
        <p className="eyebrow">Sipariş no {order.orderNumber}</p>
        <h1 className="mt-1 text-4xl md:text-5xl">
          {order.status === "PENDING_PAYMENT" ? "Siparişiniz alındı, ödeme bekleniyor" : order.status === "CANCELLED" ? "Sipariş iptal edildi" : "Teşekkürler, siparişiniz alındı"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Bu sayfanın bağlantısını saklayın; siparişinizi buradan takip edebilirsiniz.</p>
      </div>

      {order.status === "PENDING_PAYMENT" && order.paymentMethod === "BANK_TRANSFER" && (
        <div className="card grid gap-2 p-5">
          <h2 className="text-2xl">Havale / EFT bilgileri</h2>
          <dl className="grid gap-1 text-sm">
            <div><dt className="inline font-semibold">Banka: </dt><dd className="inline">{s.bankName || "—"}</dd></div>
            <div><dt className="inline font-semibold">Alıcı: </dt><dd className="inline">{s.bankAccountName || "—"}</dd></div>
            <div><dt className="inline font-semibold">IBAN: </dt><dd className="inline font-mono">{s.bankIban}</dd></div>
            <div><dt className="inline font-semibold">Tutar: </dt><dd className="inline">{formatTRY(order.total)}</dd></div>
            <div><dt className="inline font-semibold">Açıklama: </dt><dd className="inline">{order.orderNumber}</dd></div>
          </dl>
          <p className="text-sm text-ink-soft">Açıklama alanına sipariş numaranızı yazın. Ödeme kontrol edildiğinde sipariş durumu güncellenir.</p>
        </div>
      )}

      <OrderDetail order={order} />
      <Link href="/urunler" className="btn btn-outline w-fit">Alışverişe devam et</Link>
    </div>
  );
}
