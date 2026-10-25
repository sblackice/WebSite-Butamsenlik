/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { prisma } from "@/lib/db";
import { toTLInput } from "@/lib/money";
import { addImageUrl, deleteProduct, saveVariant, updateImage, uploadProductImage } from "../../_actions/products";
import { Flash, PageHead, type AdminSP } from "../../_components";
import { ProductForm } from "../ProductForm";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: AdminSP }) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } }, collections: true },
    }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="grid max-w-4xl gap-6">
      <PageHead title={product.name} />
      <p className="text-sm"><Link className="underline" href={`/urun/${product.slug}`} target="_blank">Mağazada görüntüle</Link> · <Link className="underline" href="/admin/urunler">Ürün listesi</Link></p>
      <Flash searchParams={searchParams} />
      <ProductForm product={product} categories={categories} collections={collections} inCollections={product.collections.map((c) => c.collectionId)} />

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">Görseller</h2>
        <p className="text-sm text-ink-soft">Yalnızca kullanma hakkınız olan görselleri ekleyin. Kare (1:1) oran önerilir. “/demo/” görselleri temsilî çizimdir.</p>
        <ul className="grid gap-3">
          {product.images.map((img) => (
            <li key={img.id}>
              <form action={updateImage} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={img.id} />
                <img src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
                <label className="field min-w-48 flex-1"><span className="label">Alternatif metin</span><input name="alt" defaultValue={img.alt} maxLength={160} className="input" /></label>
                <label className="field w-24"><span className="label">Sıra</span><input name="sortOrder" type="number" min={0} defaultValue={img.sortOrder} className="input" /></label>
                <button className="btn btn-outline btn-sm" name="intent" value="save" type="submit">Kaydet</button>
                <button className="btn btn-ghost btn-sm text-danger" name="intent" value="delete" type="submit">Sil</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={uploadProductImage} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <input type="hidden" name="productId" value={product.id} />
          <label className="field"><span className="label">Dosya yükle (JPG, PNG, WebP; en fazla 5 MB)</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" /></label>
          <label className="field min-w-48 flex-1"><span className="label">Alternatif metin</span><input name="alt" maxLength={160} className="input" /></label>
          <SubmitButton className="btn btn-primary btn-sm" pendingText="Yükleniyor…">Yükle</SubmitButton>
        </form>
        <form action={addImageUrl} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <label className="field min-w-64 flex-1"><span className="label">veya görsel adresi</span><input name="url" placeholder="/demo/ring-altin-blush.svg veya https://…" className="input" /></label>
          <label className="field min-w-48"><span className="label">Alternatif metin</span><input name="alt" maxLength={160} className="input" /></label>
          <button className="btn btn-outline btn-sm" type="submit">Ekle</button>
        </form>
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">Seçenekler (varyant)</h2>
        <p className="text-sm text-ink-soft">Renk, ölçü, uzunluk gibi seçenekler. Seçenek varsa müşteri birini seçmek zorundadır ve stok seçenek bazında düşer.</p>
        {[...product.variants, null].map((v) => (
          <form key={v?.id ?? "new"} action={saveVariant} className="grid grid-cols-2 items-end gap-3 border-b border-line pb-3 md:grid-cols-[2fr_1fr_1fr_1fr_80px_auto]">
            <input type="hidden" name="productId" value={product.id} />
            {v && <input type="hidden" name="id" value={v.id} />}
            <label className="field col-span-2 md:col-span-1"><span className="label">{v ? "Seçenek" : "Yeni seçenek"}</span><input name="name" defaultValue={v?.name} placeholder="Altın / 45 cm" className="input" /></label>
            <label className="field"><span className="label">SKU</span><input name="sku" defaultValue={v?.sku ?? ""} className="input" /></label>
            <label className="field"><span className="label">Fiyat farkı (TL)</span><input name="priceDelta" inputMode="decimal" defaultValue={v ? toTLInput(v.priceDelta) : "0"} className="input" /></label>
            <label className="field"><span className="label">Stok</span><input name="stock" type="number" min={0} defaultValue={v?.stock ?? 0} className="input" /></label>
            <label className="field"><span className="label">Sıra</span><input name="sortOrder" type="number" min={0} defaultValue={v?.sortOrder ?? product.variants.length} className="input" /></label>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" name="intent" value="save" type="submit">{v ? "Kaydet" : "Ekle"}</button>
              {v && <button className="btn btn-ghost btn-sm text-danger" name="intent" value="delete" type="submit">Sil</button>}
            </div>
          </form>
        ))}
      </section>

      <section className="card grid gap-3 border-danger/40 p-5">
        <h2 className="text-2xl text-danger">Ürünü sil</h2>
        <p className="text-sm text-ink-soft">Geri alınamaz. Satıştan kaldırmak için “Satışta” işaretini kaldırmanız genelde yeterlidir.</p>
        <form action={deleteProduct} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={product.id} />
          <label className="field"><span className="label">Onay için SIL yazın</span><input name="confirm" className="input w-40" autoComplete="off" /></label>
          <button className="btn btn-danger btn-sm" type="submit">Kalıcı olarak sil</button>
        </form>
      </section>
    </div>
  );
}
