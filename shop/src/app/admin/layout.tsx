import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s | Yönetim" }, robots: { index: false, follow: false } };

const nav = [
  ["/admin", "Özet"],
  ["/admin/siparisler", "Siparişler"],
  ["/admin/urunler", "Ürünler"],
  ["/admin/kategoriler", "Kategoriler"],
  ["/admin/kampanyalar", "Kampanyalar"],
  ["/admin/vitrin", "Vitrin & Ayarlar"],
  ["/admin/musteriler", "Müşteriler"],
  ["/admin/mesajlar", "Mesajlar"],
] as const;

// Every admin page and every admin action calls requireAdmin() on the server.
// Hiding links is not the protection; this check is.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-ground lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b border-line bg-ink text-ground lg:min-h-screen lg:border-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-display text-2xl font-semibold">Butamsenlik</Link>
          <Link href="/" className="text-xs underline lg:hidden">Mağaza</Link>
        </div>
        <nav aria-label="Yönetim menüsü" className="flex gap-1 overflow-x-auto px-2 pb-3 text-sm lg:flex-col">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 hover:bg-ground/10">{label}</Link>
          ))}
        </nav>
        <div className="hidden gap-2 px-4 py-4 text-xs text-ground/70 lg:grid">
          <span>{admin.email}</span>
          <Link href="/" className="underline">Mağazayı görüntüle</Link>
          <form action={logout}><button className="underline" type="submit">Çıkış yap</button></form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
