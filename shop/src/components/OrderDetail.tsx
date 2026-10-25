import type { Order, OrderEvent, OrderItem } from "@/generated/prisma/client";
import { formatTRY } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_LABEL } from "@/lib/order-status";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "CANCELLED" || status === "REFUNDED" ? "bg-danger-soft text-danger" : status === "PENDING_PAYMENT" ? "bg-warning-soft text-[#6a4b12]" : "bg-success-soft text-success";
  return <span className={`badge ${tone}`}>{ORDER_STATUS[status] ?? status}</span>;
}

export function OrderDetail({ order, fullTaxNumber = false }: { order: Order & { items: OrderItem[]; events: OrderEvent[] }; fullTaxNumber?: boolean }) {
  return (
    <div className="grid gap-6">
      {order.isTest && <p className="alert alert-warning font-semibold">TEST SİPARİŞİ — gerçek ödeme alınmadı, ürün gönderilmeyecek.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        <span className="text-sm text-ink-soft">{new Date(order.createdAt).toLocaleString("tr-TR")}</span>
        <span className="text-sm text-ink-soft">Ödeme: {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
        {order.trackingNumber && <span className="text-sm">Kargo takip no: <strong>{order.trackingNumber}</strong></span>}
      </div>
      <div className="card overflow-x-auto p-2">
        <table className="table">
          <thead><tr><th>Ürün</th><th>Adet</th><th className="text-right">Tutar</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}{i.variantName ? <span className="block text-xs text-ink-soft">{i.variantName}</span> : null}{i.personalization ? <span className="block text-xs text-ink-soft">Kişiselleştirme: {i.personalization}</span> : null}</td>
                <td>{i.quantity}</td>
                <td className="text-right">{formatTRY(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr><td colSpan={2}>Ara toplam</td><td className="text-right">{formatTRY(order.subtotal)}</td></tr>
            {order.discount > 0 && <tr><td colSpan={2}>İndirim {order.couponCode ? `(${order.couponCode})` : ""}</td><td className="text-right">−{formatTRY(order.discount)}</td></tr>}
            <tr><td colSpan={2}>Kargo</td><td className="text-right">{order.shippingFee ? formatTRY(order.shippingFee) : "Ücretsiz"}</td></tr>
            <tr className="font-bold"><td colSpan={2}>Toplam</td><td className="text-right">{formatTRY(order.total)}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4 text-sm">
          <h3 className="mb-2 font-sans text-sm font-bold">Teslimat</h3>
          <p>{order.shipName}</p><p>{order.shipLine}</p><p>{order.shipDistrict} / {order.shipCity} {order.shipPostalCode}</p><p>{order.phone}</p>
        </div>
        <div className="card p-4 text-sm">
          <h3 className="mb-2 font-sans text-sm font-bold">Fatura ({order.billingType === "CORPORATE" ? "Kurumsal" : "Bireysel"})</h3>
          <p>{order.billName}</p><p>{order.billLine}</p><p>{order.billDistrict} / {order.billCity}</p>
          {order.billTaxOffice && <p>VD: {order.billTaxOffice}</p>}
          {order.billTaxNumber && <p>No: {fullTaxNumber ? order.billTaxNumber : order.billTaxNumber.replace(/^(\d{3})\d+(\d{2})$/, "$1******$2")}</p>}
        </div>
      </div>
      {order.events.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold">Sipariş geçmişi</h3>
          <ol className="grid gap-1 text-sm text-ink-soft">
            {order.events.map((e) => <li key={e.id}>{new Date(e.createdAt).toLocaleString("tr-TR")} — {ORDER_STATUS[e.status] ?? e.status}{e.note ? `: ${e.note}` : ""}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
