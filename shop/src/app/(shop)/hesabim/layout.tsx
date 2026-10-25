import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";

const links = [
  ["/hesabim", "Üyelik bilgilerim"],
  ["/hesabim/siparisler", "Siparişlerim"],
  ["/hesabim/adresler", "Adreslerim"],
  ["/hesabim/favoriler", "Favorilerim"],
] as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-x pt-6">
      <p className="eyebrow">Hesabım</p>
      <h1 className="mt-1 text-4xl">Merhaba {user.name.split(" ")[0]}</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Hesap menüsü" className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="chip shrink-0 md:rounded-lg md:border-0 md:bg-transparent md:px-3 md:py-2 md:hover:bg-sand">{label}</Link>
          ))}
          {user.role === "ADMIN" && <Link href="/admin" className="chip shrink-0 md:rounded-lg md:border-0 md:bg-transparent md:px-3 md:py-2 md:hover:bg-sand">Yönetim paneli</Link>}
          <form action={logout}>
            <button type="submit" className="chip shrink-0 text-danger md:w-full md:rounded-lg md:border-0 md:bg-transparent md:px-3 md:py-2 md:text-left md:hover:bg-sand">Çıkış yap</button>
          </form>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
