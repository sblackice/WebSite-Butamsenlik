import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/OrderDetail";
import { prisma } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/order-status";
import { updateOrderStatus } from "../../_actions/orders";
import { Flash, PageHead, type AdminSP } from "../../_components";

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: AdminSP }) {
  const order = await prisma.order.findUnique({
    where: { id: (await params).id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } }, user: { select: { id: true, email: true } } },
  });
  if (!order) notFound();
  return (
    <div className="grid max-w-4xl gap-5">
      <PageHead title={`Sipariş ${order.orderNumber}`} />
      <p className="text-sm text-ink-soft">
        {order.email} · {order.phone} · {order.user ? <Link className="underline" href={`/admin/musteriler/${order.user.id}`}>üye</Link> : "misafir"} · Sözleşme onayı: {new Date(order.agreementsAt).toLocaleString("tr-TR")}
        {order.paymentRef && <> · Ödeme ref: {order.paymentRef}</>}
      </p>
      {order.note && <p className="alert alert-info text-sm"><strong>Müşteri notu:</strong> {order.note}</p>}
      <Flash searchParams={searchParams} />
      <form action={updateOrderStatus} className="card grid gap-3 p-5 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
        <input type="hidden" name="id" value={order.id} />
        <label className="field"><span className="label">Durum</span>
          <select name="status" defaultValue={order.status} className="select">
            {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Kargo takip no</span><input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" /></label>
        <label className="field"><span className="label">Not (müşteri görür)</span><input name="note" maxLength={300} className="input" /></label>
        <button className="btn btn-primary" type="submit">Güncelle</button>
        <p className="text-xs text-ink-soft md:col-span-4">İptal / iade durumuna geçince stok otomatik geri eklenir. Havale siparişini “Ödendi” yapmadan önce ödemeyi bankanızdan kontrol edin. Durum değişikliği müşteriye henüz e-postayla bildirilmez.</p>
      </form>
      <OrderDetail order={order} fullTaxNumber />
    </div>
  );
}
