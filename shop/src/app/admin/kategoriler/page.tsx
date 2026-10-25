import { prisma } from "@/lib/db";
import { deleteCategory, saveCategory } from "../_actions/catalog";
import { Check, Flash, PageHead, type AdminSP } from "../_components";

type Cat = { id: string; name: string; slug: string; description: string | null; parentId: string | null; sortOrder: number; isActive: boolean; _count: { products: number } };

function CategoryRow({ c, parents }: { c?: Cat; parents: { id: string; name: string }[] }) {
  return (
    <form action={saveCategory} className="grid grid-cols-2 items-end gap-3 md:grid-cols-[1.4fr_1.2fr_1.2fr_70px_auto_auto]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <label className="field col-span-2 md:col-span-1"><span className="label">{c ? "Ad" : "Yeni kategori adı"}</span><input name="name" required defaultValue={c?.name} className="input" /></label>
      <label className="field"><span className="label">Adres (slug)</span><input name="slug" defaultValue={c?.slug} className="input" /></label>
      <label className="field"><span className="label">Üst kategori</span>
        <select name="parentId" defaultValue={c?.parentId ?? ""} className="select">
          <option value="">— Ana kategori —</option>
          {parents.filter((p) => p.id !== c?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="field"><span className="label">Sıra</span><input name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} className="input" /></label>
      <Check name="isActive" label="Aktif" defaultChecked={c?.isActive ?? true} />
      <button className="btn btn-outline btn-sm" type="submit">{c ? "Kaydet" : "Ekle"}</button>
      <input type="hidden" name="description" value={c?.description ?? ""} />
    </form>
  );
}

export default async function AdminCategories({ searchParams }: { searchParams: AdminSP }) {
  const all = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  const parents = all.filter((c) => !c.parentId);
  return (
    <div className="grid gap-5">
      <PageHead title="Kategoriler" />
      <Flash searchParams={searchParams} />
      <section className="card grid gap-3 p-5"><h2 className="text-xl">Yeni kategori</h2><CategoryRow parents={parents} /></section>
      {parents.map((p) => (
        <section key={p.id} className="card grid gap-4 p-5">
          <CategoryRow c={p} parents={parents} />
          <p className="text-xs text-ink-soft">{p._count.products} ürün doğrudan bu kategoride</p>
          <div className="grid gap-4 border-l-2 border-line pl-4">
            {all.filter((c) => c.parentId === p.id).map((s) => (
              <div key={s.id} className="grid gap-1">
                <CategoryRow c={s} parents={parents} />
                <form action={deleteCategory} className="flex items-center gap-3 text-xs text-ink-soft">
                  <input type="hidden" name="id" value={s.id} />{s._count.products} ürün
                  <button className="text-danger underline" type="submit">Sil</button>
                </form>
              </div>
            ))}
          </div>
          <form action={deleteCategory}><input type="hidden" name="id" value={p.id} /><button className="text-xs text-danger underline" type="submit">“{p.name}” kategorisini sil</button></form>
        </section>
      ))}
    </div>
  );
}
