"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Cat = { name: string; slug: string; children: { name: string; slug: string }[] };

export function MobileMenu({ categories, loggedIn, isAdmin }: { categories: Cat[]; loggedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  // The drawer is rendered into <body>: the sticky header uses backdrop-blur,
  // which would otherwise trap position:fixed children inside the header box.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount flag for the portal
  useEffect(() => setMounted(true), []);

  // Close when the page changes (state adjusted during render, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  // Lock page scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand lg:hidden"
        aria-label="Menüyü aç"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
      </button>
      {mounted && createPortal(<>
      <div
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav
        id="mobile-menu"
        aria-label="Mobil menü"
        className={`fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-ground shadow-xl transition-transform duration-300 lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-2xl font-semibold">Butamsenlik</span>
          <button ref={closeRef} type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Menüyü kapat" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <Link href="/urunler?sirala=yeni" className="block rounded-lg px-3 py-3 font-semibold hover:bg-sand">Yeni Gelenler</Link>
          <Link href="/urunler?indirim=1" className="block rounded-lg px-3 py-3 font-semibold text-danger hover:bg-sand">Kampanyalar</Link>
          {categories.map((c) =>
            c.children.length ? (
              <details key={c.slug} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 font-semibold hover:bg-sand">
                  {c.name}
                  <span className="transition-transform group-open:rotate-180"><Icon name="chevronDown" size={18} /></span>
                </summary>
                <ul className="mb-2 ml-3 border-l border-line pl-2">
                  <li><Link href={`/kategori/${c.slug}`} className="block rounded-lg px-3 py-2.5 hover:bg-sand">Tüm {c.name}</Link></li>
                  {c.children.map((s) => (
                    <li key={s.slug}><Link href={`/kategori/${s.slug}`} className="block rounded-lg px-3 py-2.5 hover:bg-sand">{s.name}</Link></li>
                  ))}
                </ul>
              </details>
            ) : (
              <Link key={c.slug} href={`/kategori/${c.slug}`} className="block rounded-lg px-3 py-3 font-semibold hover:bg-sand">{c.name}</Link>
            ),
          )}
        </div>
        <div className="grid gap-1 border-t border-line p-3 text-sm">
          <Link href={loggedIn ? "/hesabim" : "/giris"} className="rounded-lg px-3 py-2.5 hover:bg-sand">{loggedIn ? "Hesabım" : "Giriş yap / Üye ol"}</Link>
          <Link href="/hesabim/favoriler" className="rounded-lg px-3 py-2.5 hover:bg-sand">Favorilerim</Link>
          <Link href="/sayfa/iletisim" className="rounded-lg px-3 py-2.5 hover:bg-sand">Müşteri hizmetleri</Link>
          {isAdmin && <Link href="/admin" className="rounded-lg px-3 py-2.5 hover:bg-sand">Yönetim paneli</Link>}
        </div>
      </nav>
      </>, document.body)}
    </>
  );
}
