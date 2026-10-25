import Link from "next/link";
import { StatusBadge } from "@/components/OrderDetail";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import { Flash, PageHead, type AdminSP } from "../_components";

export default async function AdminOrders({ searchParams }: { searchParams: AdminSP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const orders = await prisma.order.findMany({
    where: {
      ...(sp.durum && sp.durum in ORDER_STATUS ? { status: sp.durum } : {}),
      ...(sp.test === "gizle" ? { isTest: false } : {}),
      ...(q ? { OR: [{ orderNumber: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { shipName: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="grid gap-5">
      <PageHead title="Siparişler" />
      <Flash searchParams={searchParams} />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Sipariş no, e-posta, ad" aria-label="Sipariş ara" className="input w-auto" />
        <select name="durum" defaultValue={sp.durum ?? ""} aria-label="Durum" className="select w-auto">
          <option value="">Tüm durumlar</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="test" defaultValue={sp.test ?? ""} aria-label="Test siparişleri" className="select w-auto">
          <option value="">Test dahil</option><option value="gizle">Test siparişlerini gizle</option>
        </select>
        <button className="btn btn-outline" type="submit">Filtrele</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>No</th><th>Tarih</th><th>Müşteri</th><th>Ödeme</th><th>Durum</th><th className="text-right">Tutar</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link className="font-semibold underline" href={`/admin/siparisler/${o.id}`}>{o.orderNumber}</Link>{o.isTest && <span className="badge ml-1 bg-warning-soft">TEST</span>}</td>
                <td>{new Date(o.createdAt).toLocaleString("tr-TR")}</td>
                <td>{o.shipName}<span className="block text-xs text-ink-soft">{o.email}</span></td>
                <td>{o.paymentMethod === "DEMO" ? "Demo" : "Havale/EFT"}</td>
                <td><StatusBadge status={o.status} /></td>
                <td className="text-right">{formatTRY(o.total)}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6} className="text-ink-soft">Sipariş bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
