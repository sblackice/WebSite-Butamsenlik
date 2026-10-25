import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center gap-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl">Aradığınız sayfa bulunamadı</h1>
      <p className="text-ink-soft">Bağlantı değişmiş veya ürün satıştan kaldırılmış olabilir.</p>
      <div className="flex gap-3"><Link href="/" className="btn btn-primary">Ana sayfa</Link><Link href="/urunler" className="btn btn-outline">Ürünler</Link></div>
    </div>
  );
}
