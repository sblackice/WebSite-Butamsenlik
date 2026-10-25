import type { Category, Collection, Product } from "@/generated/prisma/client";
import { SubmitButton } from "@/components/SubmitButton";
import { toTLInput } from "@/lib/money";
import { saveProduct } from "../_actions/products";
import { Check, F } from "../_components";

export function ProductForm({
  product,
  categories,
  collections,
  inCollections = [],
}: {
  product?: Product;
  categories: (Category & { children: Category[] })[];
  collections: Collection[];
  inCollections?: string[];
}) {
  const p = product;
  return (
    <form action={saveProduct} className="card grid gap-5 p-5">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <F label="Ürün adı"><input name="name" required maxLength={120} defaultValue={p?.name} className="input" /></F>
        <F label="Adres (slug)" hint="Boş bırakırsanız addan oluşturulur."><input name="slug" maxLength={90} defaultValue={p?.slug} className="input" /></F>
        <F label="Kategori">
          <select name="categoryId" required defaultValue={p?.categoryId ?? ""} className="select">
            <option value="" disabled>Seçin</option>
            {categories.map((c) => (
              <optgroup key={c.id} label={c.name}>
                <option value={c.id}>{c.name} (ana)</option>
                {c.children.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </F>
        <F label="Stok kodu (SKU)"><input name="sku" maxLength={40} defaultValue={p?.sku ?? ""} className="input" /></F>
        <F label="Satış fiyatı (TL)" hint="Örn. 349,90"><input name="price" required inputMode="decimal" defaultValue={toTLInput(p?.price)} className="input" /></F>
        <F label="Eski fiyat (TL)" hint="İndirim göstermek için; boşsa indirim yok."><input name="compareAtPrice" inputMode="decimal" defaultValue={toTLInput(p?.compareAtPrice)} className="input" /></F>
        <F label="Stok (seçeneksiz ürünler)" hint="Ürünün seçenekleri varsa stok seçeneklerden yönetilir."><input name="stock" type="number" min={0} defaultValue={p?.stock ?? 0} className="input" /></F>
        <F label="Renk / metal (filtre)">
          <select name="metal" defaultValue={p?.metal ?? ""} className="select">
            <option value="">—</option><option value="altin">Altın renk</option><option value="rose">Rose renk</option><option value="gumus">Gümüş renk</option><option value="celik">Çelik</option>
          </select>
        </F>
        <F label="Malzeme"><input name="material" maxLength={200} defaultValue={p?.material ?? ""} className="input" /></F>
      </div>
      <F label="Açıklama"><textarea name="description" required maxLength={5000} defaultValue={p?.description} className="textarea" /></F>
      <F label="Özellikler" hint="Her satıra bir özellik."><textarea name="details" maxLength={3000} defaultValue={p?.details} className="textarea" /></F>
      <fieldset className="grid gap-3 md:grid-cols-3">
        <legend className="label mb-2">Kişiselleştirme</legend>
        <F label="Tür">
          <select name="personalization" defaultValue={p?.personalization ?? "NONE"} className="select">
            <option value="NONE">Yok</option><option value="LETTER">Tek harf</option><option value="TEXT">Yazı (isim vb.)</option>
          </select>
        </F>
        <F label="Alan etiketi"><input name="personalizationLabel" maxLength={40} defaultValue={p?.personalizationLabel ?? ""} placeholder="Yazılacak isim" className="input" /></F>
        <F label="En fazla karakter"><input name="personalizationMax" type="number" min={0} max={40} defaultValue={p?.personalizationMax ?? 0} className="input" /></F>
      </fieldset>
      {collections.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="label mb-1">Koleksiyonlar</legend>
          <div className="flex flex-wrap gap-4">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="collections" value={c.id} defaultChecked={inCollections.includes(c.id)} className="checkbox" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-5">
        <Check name="isActive" label="Satışta (aktif)" defaultChecked={p?.isActive ?? true} />
        <Check name="isFeatured" label="Öne çıkan" defaultChecked={p?.isFeatured} />
        <Check name="isDemo" label="Demo ürün" defaultChecked={p?.isDemo ?? false} />
      </div>
      <SubmitButton className="btn btn-primary w-fit">{p ? "Kaydet" : "Ürünü oluştur"}</SubmitButton>
    </form>
  );
}
