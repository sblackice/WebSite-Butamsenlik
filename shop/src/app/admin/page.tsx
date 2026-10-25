import Link from "next/link";
import { StatusBadge } from "@/components/OrderDetail";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { isDemoPaymentEnabled } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pending, paidAgg, products, customers, unread, recent, lowVariants, lowProducts, settings, demoCount] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "PREPARING"] }, isTest: false } }),
    prisma.order.aggregate({ where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] }, isTest: false }, _sum: { total: true }, _count: true }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.productVariant.findMany({ where: { stock: { lte: 2 } }, include: { product: true }, take: 10 }),
    prisma.product.findMany({ where: { stock: { lte: 2 }, variants: { none: {} }, isActive: true }, take: 10 }),
    getSettings(),
    prisma.product.count({ where: { isDemo: true } }),
  ]);

  const todo: string[] = [];
  if (!settings.companyTitle) todo.push("İşletme bilgilerini girin (Vitrin & Ayarlar → İşletme bilgileri). Yasal sayfalar bu bilgileri kullanır.");
  if (!settings.bankIban && !isDemoPaymentEnabled()) todo.push("Aktif ödeme yöntemi yok: IBAN girin veya bir ödeme sağlayıcısı entegre edin.");
  if (isDemoPaymentEnabled()) todo.push("Demo ödeme açık (PAYMENT_PROVIDER=demo). Canlıya geçmeden önce kapatın.");
  if (demoCount) todo.push(`${demoCount} demo ürün var. Gerçek ürünlerinizi ekleyip demo ürünleri silin veya pasif yapın.`);

  const stats = [
    ["Açık siparişler", String(pending)],
    ["Ödenmiş ciro (test hariç)", formatTRY(paidAgg._sum.total ?? 0)],
    ["Aktif ürün", String(products)],
    ["Müşteri", String(customers)],
    ["Okunmamış mesaj", String(unread)],
  ];

  return (
    <div className="grid gap-8">
      <h1 className="text-4xl">Özet</h1>
      {todo.length > 0 && (
        <ul className="alert alert-warning grid gap-1 text-sm">
          {todo.map((t) => <li key={t}>• {t}</li>)}
        </ul>
      )}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([k, v]) => (
          <li key={k} className="card p-4"><p className="text-xs text-ink-soft">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></li>
        ))}
      </ul>
      <section className="grid gap-3">
        <h2 className="text-2xl">Son siparişler</h2>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>No</th><th>Tarih</th><th>Müşteri</th><th>Durum</th><th className="text-right">Tutar</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link className="underline" href={`/admin/siparisler/${o.id}`}>{o.orderNumber}</Link>{o.isTest && <span className="badge ml-1 bg-warning-soft">TEST</span>}</td>
                  <td>{new Date(o.createdAt).toLocaleString("tr-TR")}</td>
                  <td>{o.shipName}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right">{formatTRY(o.total)}</td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={5} className="text-ink-soft">Henüz sipariş yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-3">
        <h2 className="text-2xl">Azalan stok (≤ 2)</h2>
        <ul className="card grid gap-1 p-4 text-sm">
          {lowProducts.map((p) => <li key={p.id}><Link className="underline" href={`/admin/urunler/${p.id}`}>{p.name}</Link> — {p.stock}</li>)}
          {lowVariants.map((v) => <li key={v.id}><Link className="underline" href={`/admin/urunler/${v.productId}`}>{v.product.name} / {v.name}</Link> — {v.stock}</li>)}
          {!lowProducts.length && !lowVariants.length && <li className="text-ink-soft">Stoğu azalan ürün yok.</li>}
        </ul>
      </section>
    </div>
  );
}
