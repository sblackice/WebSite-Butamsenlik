import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import { getCategoryTree } from "@/lib/catalog";
import { Icon } from "./Icon";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const [user, count, categories] = await Promise.all([getCurrentUser(), cartCount(), getCategoryTree()]);
  const cats = categories.map((c) => ({ name: c.name, slug: c.slug, children: c.children.map((s) => ({ name: s.name, slug: s.slug })) }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/95 backdrop-blur">
      <div className="container-x flex items-center gap-2 py-2 md:gap-4 md:py-3">
        <MobileMenu categories={cats} loggedIn={!!user} isAdmin={user?.role === "ADMIN"} />
        <Link href="/" className="font-display text-[1.75rem] font-semibold leading-none tracking-tight md:text-[2.1rem]" aria-label="Butamsenlik ana sayfa">
          Butamsenlik
        </Link>

        <form action="/arama" role="search" className="mx-auto hidden w-full max-w-md md:block">
          <label htmlFor="q-desktop" className="sr-only">Ürün ara</label>
          <div className="relative">
            <input id="q-desktop" name="q" type="search" placeholder="Kolye, harf, halka küpe…" className="input rounded-full pr-12" maxLength={80} />
            <button type="submit" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label="Ara">
              <Icon name="search" size={20} />
            </button>
          </div>
        </form>

        <nav aria-label="Hesap ve sepet" className="ml-auto flex items-center md:ml-0">
          <Link href={user ? "/hesabim" : "/giris"} className="hidden h-11 items-center gap-2 rounded-full px-3 hover:bg-sand sm:flex">
            <Icon name="user" />
            <span className="hidden text-sm xl:inline">{user ? user.name.split(" ")[0] : "Giriş yap"}</span>
            <span className="sr-only xl:hidden">{user ? "Hesabım" : "Giriş yap"}</span>
          </Link>
          <Link href="/hesabim/favoriler" className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Favorilerim">
            <Icon name="heart" />
          </Link>
          <Link href="/sepet" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label={`Sepetim, ${count} ürün`}>
            <Icon name="bag" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold-deep px-1 text-[11px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <form action="/arama" role="search" className="container-x pb-2 md:hidden">
        <label htmlFor="q-mobile" className="sr-only">Ürün ara</label>
        <div className="relative">
          <input id="q-mobile" name="q" type="search" placeholder="Ürün ara" className="input rounded-full pr-12" maxLength={80} />
          <button type="submit" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full" aria-label="Ara">
            <Icon name="search" size={20} />
          </button>
        </div>
      </form>

      <nav aria-label="Kategoriler" className="hidden border-t border-line lg:block">
        <ul className="container-x flex items-center justify-center gap-1 text-[0.92rem]">
          <li><Link href="/urunler?sirala=yeni" className="block px-3 py-3 font-semibold hover:text-gold-deep">Yeni Gelenler</Link></li>
          {cats.map((c) => (
            <li key={c.slug} className="nav-item relative">
              <Link href={`/kategori/${c.slug}`} className="flex items-center gap-1 px-3 py-3 font-semibold hover:text-gold-deep" aria-haspopup={c.children.length ? "true" : undefined}>
                {c.name}
                {c.children.length > 0 && <Icon name="chevronDown" size={14} />}
              </Link>
              {c.children.length > 0 && (
                <div className="nav-panel absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-1">
                  <ul className="card p-2 shadow-lg">
                    {c.children.map((s) => (
                      <li key={s.slug}><Link href={`/kategori/${s.slug}`} className="block rounded-lg px-3 py-2 hover:bg-sand">{s.name}</Link></li>
                    ))}
                    <li className="mt-1 border-t border-line pt-1"><Link href={`/kategori/${c.slug}`} className="block rounded-lg px-3 py-2 font-semibold hover:bg-sand">Tümünü gör</Link></li>
                  </ul>
                </div>
              )}
            </li>
          ))}
          <li><Link href="/urunler?indirim=1" className="block px-3 py-3 font-semibold text-danger hover:underline">Kampanyalar</Link></li>
        </ul>
      </nav>
    </header>
  );
}
