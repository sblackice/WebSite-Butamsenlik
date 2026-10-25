/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { normalizeSearch } from "@/lib/text";
import { Flash, PageHead, type AdminSP } from "../_components";

export default async function AdminProducts({ searchParams }: { searchParams: AdminSP }) {
  const sp = await searchParams;
  const q = normalizeSearch(sp.q ?? "");
  const products = await prisma.product.findMany({
    where: {
      ...(q ? { AND: q.split(" ").map((w) => ({ searchText: { contains: w } })) } : {}),
      ...(sp.kategori ? { categoryId: sp.kategori } : {}),
      ...(sp.durum === "pasif" ? { isActive: false } : sp.durum === "aktif" ? { isActive: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { select: { stock: true } } },
    take: 200,
  });
  const cats = await prisma.category.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] });
  return (
    <div className="grid gap-5">
      <PageHead title="Ürünler" action={{ href: "/admin/urunler/yeni", label: "Yeni ürün" }} />
      <Flash searchParams={searchParams} />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Ürün ara" aria-label="Ürün ara" className="input w-auto" />
        <select name="kategori" defaultValue={sp.kategori ?? ""} aria-label="Kategori" className="select w-auto">
          <option value="">Tüm kategoriler</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
        </select>
        <select name="durum" defaultValue={sp.durum ?? ""} aria-label="Durum" className="select w-auto">
          <option value="">Tümü</option><option value="aktif">Aktif</option><option value="pasif">Pasif</option>
        </select>
        <button className="btn btn-outline" type="submit">Filtrele</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th></th><th>Ürün</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th>Durum</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.length ? p.variants.reduce((n, v) => n + v.stock, 0) : p.stock;
              return (
                <tr key={p.id}>
                  <td className="w-14">{p.images[0] && <img src={p.images[0].url} alt="" className="h-12 w-12 rounded object-cover" />}</td>
                  <td><Link className="font-semibold underline" href={`/admin/urunler/${p.id}`}>{p.name}</Link>{p.isDemo && <span className="badge ml-1 bg-warning-soft">demo</span>}<span className="block text-xs text-ink-soft">{p.sku}</span></td>
                  <td>{p.category.name}</td>
                  <td>{formatTRY(p.price)}{p.compareAtPrice ? <s className="block text-xs text-ink-soft">{formatTRY(p.compareAtPrice)}</s> : null}</td>
                  <td className={stock <= 2 ? "font-bold text-danger" : ""}>{stock}{p.variants.length ? <span className="block text-xs text-ink-soft">{p.variants.length} seçenek</span> : null}</td>
                  <td>{p.isActive ? "Aktif" : <span className="text-ink-soft">Pasif</span>}</td>
                </tr>
              );
            })}
            {!products.length && <tr><td colSpan={6} className="text-ink-soft">Ürün bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
