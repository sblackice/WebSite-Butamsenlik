import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Newsletter } from "./Newsletter";

export async function Footer() {
  const [cats, s] = await Promise.all([getCategoryTree(), getSettings()]);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-ink text-ground">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <p className="font-display text-4xl font-semibold">Butamsenlik</p>
          <p className="max-w-sm text-sm text-ground/75">Bültenimize katılın; yeni koleksiyon ve kampanyalardan ilk siz haberdar olun.</p>
          <div className="rounded-2xl bg-ground p-4 text-ink"><Newsletter /></div>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-gold-light">Kategoriler</h2>
          <ul className="grid gap-2 text-sm text-ground/80">
            {cats.map((c) => (
              <li key={c.slug}><Link href={`/kategori/${c.slug}`} className="hover:text-ground hover:underline">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-gold-light">Müşteri hizmetleri</h2>
          <ul className="grid gap-2 text-sm text-ground/80">
            <li><Link href="/sayfa/iletisim" className="hover:underline">İletişim</Link></li>
            <li><Link href="/sayfa/sss" className="hover:underline">Sıkça sorulan sorular</Link></li>
            <li><Link href="/sayfa/kargo-ve-teslimat" className="hover:underline">Kargo ve teslimat</Link></li>
            <li><Link href="/sayfa/iade-ve-degisim" className="hover:underline">İade ve değişim</Link></li>
            <li><Link href="/hesabim/siparisler" className="hover:underline">Sipariş takibi</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-gold-light">Kurumsal</h2>
          <ul className="grid gap-2 text-sm text-ground/80">
            <li><Link href="/sayfa/hakkimizda" className="hover:underline">Hakkımızda</Link></li>
            <li><Link href="/sayfa/gizlilik" className="hover:underline">Gizlilik politikası</Link></li>
            <li><Link href="/sayfa/kvkk" className="hover:underline">KVKK aydınlatma metni</Link></li>
            <li><Link href="/sayfa/on-bilgilendirme" className="hover:underline">Ön bilgilendirme formu</Link></li>
            <li><Link href="/sayfa/mesafeli-satis" className="hover:underline">Mesafeli satış sözleşmesi</Link></li>
            {s.instagramUrl && <li><a href={s.instagramUrl} rel="noopener noreferrer" target="_blank" className="hover:underline">Instagram</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ground/15">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ground/60 md:flex-row md:justify-between">
          <p>© {year} {s.companyTitle || "Butamsenlik"}. Tüm hakları saklıdır.</p>
          <p>Ödeme altyapısı: henüz canlı ödeme sağlayıcısı bağlı değil.</p>
        </div>
      </div>
    </footer>
  );
}
