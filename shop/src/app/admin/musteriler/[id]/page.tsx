import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/OrderDetail";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { setUserActive } from "../../_actions/orders";
import { Flash, PageHead, type AdminSP } from "../../_components";

export default async function AdminCustomer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: AdminSP }) {
  const user = await prisma.user.findUnique({
    where: { id: (await params).id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, marketingOk: true, createdAt: true, addresses: true, orders: { orderBy: { createdAt: "desc" } } },
  });
  if (!user) notFound();
  return (
    <div className="grid max-w-4xl gap-5">
      <PageHead title={user.name} />
      <Flash searchParams={searchParams} />
      <div className="card grid gap-1 p-5 text-sm">
        <p>E-posta: {user.email}</p>
        <p>Telefon: {user.phone ?? "—"}</p>
        <p>Rol: {user.role === "ADMIN" ? "Yönetici" : "Müşteri"} · Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR")}</p>
        <p>Ticari e-posta izni: {user.marketingOk ? "Var" : "Yok"}</p>
        <form action={setUserActive} className="mt-3">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="active" value={user.isActive ? "0" : "1"} />
          <button className={`btn btn-sm ${user.isActive ? "btn-outline" : "btn-primary"}`} type="submit">{user.isActive ? "Hesabı pasif yap" : "Hesabı etkinleştir"}</button>
        </form>
      </div>
      <section className="grid gap-2">
        <h2 className="text-2xl">Adresler</h2>
        {user.addresses.map((a) => <p key={a.id} className="card p-3 text-sm"><strong>{a.title}</strong> — {a.fullName}, {a.line}, {a.district}/{a.city}</p>)}
        {!user.addresses.length && <p className="text-sm text-ink-soft">Kayıtlı adres yok.</p>}
      </section>
      <section className="grid gap-2">
        <h2 className="text-2xl">Siparişler</h2>
        {user.orders.map((o) => (
          <Link key={o.id} href={`/admin/siparisler/${o.id}`} className="card flex justify-between p-3 text-sm hover:border-ink">
            <span>{o.orderNumber} · {new Date(o.createdAt).toLocaleDateString("tr-TR")}</span>
            <span className="flex gap-2"><StatusBadge status={o.status} />{formatTRY(o.total)}</span>
          </Link>
        ))}
        {!user.orders.length && <p className="text-sm text-ink-soft">Sipariş yok.</p>}
      </section>
    </div>
  );
}
