import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/OrderDetail";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";

export const metadata: Metadata = { title: "Siparişlerim", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/hesabim/siparisler");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } });
  return (
    <div className="grid gap-4">
      <h2 className="text-3xl">Siparişlerim</h2>
      {orders.length === 0 ? <p className="text-ink-soft">Henüz siparişiniz yok.</p> : (
        <ul className="grid gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/hesabim/siparisler/${o.orderNumber}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-ink">
                <span><strong>{o.orderNumber}</strong>{o.isTest && <span className="badge ml-2 bg-warning-soft">TEST</span>}<span className="block text-sm text-ink-soft">{new Date(o.createdAt).toLocaleDateString("tr-TR")} · {o._count.items} kalem</span></span>
                <span className="flex items-center gap-3"><StatusBadge status={o.status} /><strong>{formatTRY(o.total)}</strong></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
