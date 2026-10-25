import { prisma } from "@/lib/db";
import { formatTRY, toTLInput } from "@/lib/money";
import { categoryDiscount, deleteCoupon, saveCoupon } from "../_actions/catalog";
import { Check, Flash, PageHead, type AdminSP } from "../_components";

const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

export default async function AdminCampaigns({ searchParams }: { searchParams: AdminSP }) {
  const [coupons, cats] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
  ]);
  const rows = [...coupons, null];
  return (
    <div className="grid gap-6">
      <PageHead title="Kampanyalar" />
      <Flash searchParams={searchParams} />

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">İndirim kodları</h2>
        {rows.map((c) => (
          <div key={c?.id ?? "new"} className="grid gap-2 border-b border-line pb-4">
            <form action={saveCoupon} className="grid grid-cols-2 items-end gap-3 md:grid-cols-8">
              {c && <input type="hidden" name="id" value={c.id} />}
              <label className="field col-span-2 md:col-span-1"><span className="label">{c ? "Kod" : "Yeni kod"}</span><input name="code" required defaultValue={c?.code} className="input uppercase" /></label>
              <label className="field"><span className="label">Tür</span><select name="type" defaultValue={c?.type ?? "PERCENT"} className="select"><option value="PERCENT">Yüzde</option><option value="FIXED">Tutar (TL)</option></select></label>
              <label className="field"><span className="label">Değer</span><input name="value" required defaultValue={c ? (c.type === "FIXED" ? toTLInput(c.value) : String(c.value)) : ""} className="input" /></label>
              <label className="field"><span className="label">Min. sepet (TL)</span><input name="minSubtotal" defaultValue={c ? toTLInput(c.minSubtotal) : "0"} className="input" /></label>
              <label className="field"><span className="label">Başlangıç</span><input name="startsAt" type="date" defaultValue={d(c?.startsAt ?? null)} className="input" /></label>
              <label className="field"><span className="label">Bitiş</span><input name="endsAt" type="date" defaultValue={d(c?.endsAt ?? null)} className="input" /></label>
              <label className="field"><span className="label">Kullanım limiti</span><input name="usageLimit" type="number" min={1} defaultValue={c?.usageLimit ?? ""} className="input" /></label>
              <div className="flex items-center gap-3"><Check name="isActive" label="Aktif" defaultChecked={c?.isActive ?? true} /><button className="btn btn-outline btn-sm" type="submit">{c ? "Kaydet" : "Ekle"}</button></div>
            </form>
            {c && (
              <form action={deleteCoupon} className="flex gap-3 text-xs text-ink-soft">
                <input type="hidden" name="id" value={c.id} />
                <span>{c.usedCount} kez kullanıldı · {c.type === "FIXED" ? formatTRY(c.value) : `%${c.value}`}</span>
                <button className="text-danger underline" type="submit">Sil</button>
              </form>
            )}
          </div>
        ))}
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="text-2xl">Kategoriye toplu indirim</h2>
        <p className="text-sm text-ink-soft">Seçilen kategori ve alt kategorilerindeki tüm ürünlerde eski fiyat korunur, satış fiyatı yüzde kadar düşürülür. 0 yazarsanız indirim kaldırılır ve eski fiyata dönülür.</p>
        <form action={categoryDiscount} className="flex flex-wrap items-end gap-3">
          <label className="field"><span className="label">Kategori</span>
            <select name="categoryId" required className="select">
              {cats.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name} (tümü)</option>
                  {c.children.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="field"><span className="label">İndirim %</span><input name="percent" type="number" min={0} max={90} required className="input w-28" /></label>
          <button className="btn btn-primary btn-sm" type="submit">Uygula</button>
        </form>
      </section>
    </div>
  );
}
