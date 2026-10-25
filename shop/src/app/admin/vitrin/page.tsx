/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/db";
import { toTLInput } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { saveBanner, saveCollection, saveSettings } from "../_actions/storefront";
import { Check, F, Flash, PageHead, TONE_OPTIONS, type AdminSP } from "../_components";

function ToneSelect({ value }: { value?: string }) {
  return (
    <select name="tone" defaultValue={value ?? "blush"} className="select">
      {TONE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

export default async function AdminStorefront({ searchParams }: { searchParams: AdminSP }) {
  const [s, banners, collections] = await Promise.all([
    getSettings(),
    prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);

  return (
    <div className="grid max-w-5xl gap-6">
      <PageHead title="Vitrin & Ayarlar" />
      <Flash searchParams={searchParams} />

      <form action={saveSettings} className="card grid gap-5 p-5">
        <h2 className="text-2xl">Mağaza ayarları</h2>
        <F label="Duyuru bandı" hint="Birden fazla mesajı | ile ayırın."><input name="announcement" defaultValue={s.announcement} className="input" /></F>
        <div className="grid gap-4 md:grid-cols-2">
          <F label="Kargo ücreti (TL)"><input name="shippingFee" defaultValue={toTLInput(Number(s.shippingFee))} className="input" /></F>
          <F label="Ücretsiz kargo alt sınırı (TL)" hint="0 = her zaman ücretli (ücret 0 ise her zaman ücretsiz)"><input name="freeShippingThreshold" defaultValue={toTLInput(Number(s.freeShippingThreshold))} className="input" /></F>
        </div>
        <F label="Kargo bilgisi (ürün sayfasında)"><input name="shippingInfo" defaultValue={s.shippingInfo} className="input" /></F>
        <F label="İade bilgisi (ürün sayfasında)"><input name="returnInfo" defaultValue={s.returnInfo} className="input" /></F>
        <div className="grid gap-4 md:grid-cols-2">
          <F label="Marka mesajı başlığı"><input name="brandStoryTitle" defaultValue={s.brandStoryTitle} className="input" /></F>
          <F label="Marka mesajı"><input name="brandStoryText" defaultValue={s.brandStoryText} className="input" /></F>
        </div>

        <h3 className="mt-2 text-xl">Havale / EFT</h3>
        <p className="text-sm text-ink-soft">IBAN girildiğinde ödeme adımında “Havale / EFT” seçeneği açılır.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <F label="Banka"><input name="bankName" defaultValue={s.bankName} className="input" /></F>
          <F label="Alıcı adı"><input name="bankAccountName" defaultValue={s.bankAccountName} className="input" /></F>
          <F label="IBAN"><input name="bankIban" defaultValue={s.bankIban} placeholder="TR00 0000 …" className="input font-mono" /></F>
        </div>

        <h3 className="mt-2 text-xl">İşletme bilgileri</h3>
        <p className="text-sm text-ink-soft">Yasal sayfalarda ve footer’da kullanılır. Gerçek, doğrulanmış bilgileri girin.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <F label="Unvan"><input name="companyTitle" defaultValue={s.companyTitle} className="input" /></F>
          <F label="Adres"><input name="companyAddress" defaultValue={s.companyAddress} className="input" /></F>
          <F label="Vergi dairesi"><input name="companyTaxOffice" defaultValue={s.companyTaxOffice} className="input" /></F>
          <F label="Vergi no"><input name="companyTaxNumber" defaultValue={s.companyTaxNumber} className="input" /></F>
          <F label="MERSİS no"><input name="companyMersis" defaultValue={s.companyMersis} className="input" /></F>
          <F label="E-posta"><input name="companyEmail" type="email" defaultValue={s.companyEmail} className="input" /></F>
          <F label="Telefon"><input name="companyPhone" defaultValue={s.companyPhone} className="input" /></F>
          <F label="WhatsApp numarası" hint="Ülke koduyla, örn. 905xxxxxxxxx"><input name="whatsappNumber" defaultValue={s.whatsappNumber} className="input" /></F>
          <F label="Instagram adresi"><input name="instagramUrl" defaultValue={s.instagramUrl} placeholder="https://instagram.com/…" className="input" /></F>
        </div>
        <button className="btn btn-primary w-fit" type="submit">Ayarları kaydet</button>
      </form>

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">Bannerlar</h2>
        <p className="text-sm text-ink-soft">“Ana alan” bannerlarından ilki büyük, sonraki ikisi yanda görünür. “Kampanya şeridi” ana sayfanın ortasında görünür.</p>
        {[...banners, null].map((b) => (
          <form key={b?.id ?? "new"} action={saveBanner} className="grid gap-3 border-b border-line pb-4 md:grid-cols-4">
            {b && <input type="hidden" name="id" value={b.id} />}
            <F label="Yer"><select name="placement" defaultValue={b?.placement ?? "HERO"} className="select"><option value="HERO">Ana alan</option><option value="PROMO">Kampanya şeridi</option></select></F>
            <F label={b ? "Başlık" : "Yeni banner başlığı"}><input name="title" defaultValue={b?.title} className="input" /></F>
            <F label="Üst yazı"><input name="eyebrow" defaultValue={b?.eyebrow ?? ""} className="input" /></F>
            <F label="Alt yazı"><input name="subtitle" defaultValue={b?.subtitle ?? ""} className="input" /></F>
            <F label="Düğme yazısı"><input name="ctaLabel" defaultValue={b?.ctaLabel ?? ""} className="input" /></F>
            <F label="Bağlantı" hint="Site içi, örn. /kategori/kolye"><input name="ctaHref" defaultValue={b?.ctaHref ?? ""} className="input" /></F>
            <F label="Renk"><ToneSelect value={b?.tone} /></F>
            <F label="Sıra"><input name="sortOrder" type="number" min={0} defaultValue={b?.sortOrder ?? 0} className="input" /></F>
            <F label="Görsel adresi"><input name="imageUrl" defaultValue={b?.imageUrl ?? ""} className="input" /></F>
            <F label="veya görsel yükle"><input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" /></F>
            <div className="flex items-end gap-3 md:col-span-2">
              {b?.imageUrl && <img src={b.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />}
              <Check name="isActive" label="Aktif" defaultChecked={b?.isActive ?? true} />
              <button className="btn btn-outline btn-sm" name="intent" value="save" type="submit">{b ? "Kaydet" : "Ekle"}</button>
              {b && <button className="btn btn-ghost btn-sm text-danger" name="intent" value="delete" type="submit">Sil</button>}
            </div>
          </form>
        ))}
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">Koleksiyonlar</h2>
        <p className="text-sm text-ink-soft">Koleksiyona ürün eklemek için ürün düzenleme sayfasındaki “Koleksiyonlar” kutularını kullanın.</p>
        {[...collections, null].map((c) => (
          <form key={c?.id ?? "new"} action={saveCollection} className="grid gap-3 border-b border-line pb-4 md:grid-cols-[1.2fr_1fr_2fr_1fr_70px_auto]">
            {c && <input type="hidden" name="id" value={c.id} />}
            <F label={c ? `Ad (${c._count.products} ürün)` : "Yeni koleksiyon"}><input name="name" defaultValue={c?.name} className="input" /></F>
            <F label="Adres"><input name="slug" defaultValue={c?.slug} className="input" /></F>
            <F label="Açıklama"><input name="description" defaultValue={c?.description ?? ""} className="input" /></F>
            <F label="Renk"><ToneSelect value={c?.tone} /></F>
            <F label="Sıra"><input name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} className="input" /></F>
            <div className="flex items-end gap-3">
              <Check name="isFeatured" label="Ana sayfada" defaultChecked={c?.isFeatured ?? true} />
              <button className="btn btn-outline btn-sm" name="intent" value="save" type="submit">{c ? "Kaydet" : "Ekle"}</button>
              {c && <button className="btn btn-ghost btn-sm text-danger" name="intent" value="delete" type="submit">Sil</button>}
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
