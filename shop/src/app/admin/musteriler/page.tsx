import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHead, type AdminSP } from "../_components";

export default async function AdminCustomers({ searchParams }: { searchParams: AdminSP }) {
  const q = ((await searchParams).q ?? "").trim().toLowerCase();
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
  });
  return (
    <div className="grid gap-5">
      <PageHead title="Müşteriler" />
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Ad veya e-posta" aria-label="Müşteri ara" className="input w-auto" /><button className="btn btn-outline" type="submit">Ara</button></form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>Sipariş</th><th>Kayıt</th><th>Durum</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link className="underline" href={`/admin/musteriler/${u.id}`}>{u.name}</Link></td>
                <td>{u.email}</td>
                <td>{u.role === "ADMIN" ? "Yönetici" : "Müşteri"}</td>
                <td>{u._count.orders}</td>
                <td>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</td>
                <td>{u.isActive ? "Aktif" : <span className="text-danger">Pasif</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft">Şifreler hiçbir zaman görüntülenemez. Yönetici yetkisi yalnızca sunucuda komutla verilir: <code>npm run admin:create</code>.</p>
    </div>
  );
}
