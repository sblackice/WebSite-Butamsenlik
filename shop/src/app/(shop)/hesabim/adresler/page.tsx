import type { Metadata } from "next";
import { deleteAddress } from "@/app/actions/account";
import { AddressForm } from "@/components/AccountForms";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Adreslerim", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/hesabim/adresler");
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { title: "asc" }] });
  return (
    <div className="grid gap-6">
      <h2 className="text-3xl">Adreslerim</h2>
      {addresses.length === 0 && <p className="text-ink-soft">Kayıtlı adresiniz yok.</p>}
      {addresses.map((a) => (
        <details key={a.id} className="card p-5">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
            <span><strong>{a.title}</strong>{a.isDefault && <span className="badge ml-2 bg-sage">Varsayılan</span>}<span className="block text-sm text-ink-soft">{a.fullName} — {a.line}, {a.district}/{a.city}</span></span>
            <span className="text-sm underline">Düzenle</span>
          </summary>
          <div className="mt-4 grid gap-4">
            <AddressForm address={a} />
            <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost btn-sm text-danger" type="submit">Adresi sil</button></form>
          </div>
        </details>
      ))}
      <section className="card grid gap-4 p-5"><h3 className="text-2xl">Yeni adres ekle</h3><AddressForm /></section>
    </div>
  );
}
