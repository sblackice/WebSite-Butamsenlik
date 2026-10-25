"use client";

import { useActionState } from "react";
import { saveAddress, updateProfile, type AccountState } from "@/app/actions/account";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function ProfileForm({ name, email, phone, marketing }: { name: string; email: string; phone: string; marketing: boolean }) {
  const [state, action] = useActionState<AccountState, FormData>(updateProfile, null);
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field"><label htmlFor="name" className="label">Ad soyad</label><input id="name" name="name" defaultValue={name} required className="input" autoComplete="name" /></div>
        <div className="field"><label htmlFor="phone" className="label">Telefon</label><input id="phone" name="phone" type="tel" defaultValue={phone} className="input" autoComplete="tel" /></div>
        <div className="field sm:col-span-2"><label htmlFor="em" className="label">E-posta</label><input id="em" value={email} readOnly className="input bg-sand" aria-describedby="em-hint" /><p id="em-hint" className="hint">E-posta değişikliği için müşteri hizmetlerine yazın.</p></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="marketing" defaultChecked={marketing} className="checkbox" />Kampanya e-postaları almak istiyorum</label>
      <SubmitButton className="btn btn-primary w-fit">Kaydet</SubmitButton>
    </form>
  );
}

type Addr = { id: string; title: string; fullName: string; phone: string; city: string; district: string; line: string; postalCode: string | null; isDefault: boolean };

export function AddressForm({ address }: { address?: Addr }) {
  const [state, action] = useActionState<AccountState, FormData>(saveAddress, null);
  // A new-address form starts empty again after a successful save.
  const a = address;
  const f = (n: string) => state?.fields?.[n];
  const input = (name: keyof Addr, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={`${a?.id ?? "new"}-${name}`} className="label">{label}</label>
      <input id={`${a?.id ?? "new"}-${name}`} name={name} defaultValue={state?.values?.[name] ?? (a?.[name] as string) ?? ""} className="input" aria-invalid={!!f(name) || undefined} {...extra} />
      {f(name) && <p className="text-sm text-danger">{f(name)}</p>}
    </div>
  );
  return (
    <form action={action} className="grid gap-4">
      {a && <input type="hidden" name="id" value={a.id} />}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        {input("title", "Adres başlığı", { placeholder: "Ev, İş…" })}
        {input("fullName", "Ad soyad", { autoComplete: "name" })}
        {input("phone", "Telefon", { type: "tel", autoComplete: "tel" })}
        {input("city", "İl")}
        {input("district", "İlçe")}
        {input("postalCode", "Posta kodu", { inputMode: "numeric", maxLength: 5 })}
      </div>
      {input("line", "Açık adres")}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" defaultChecked={a?.isDefault} className="checkbox" />Varsayılan adres yap</label>
      <SubmitButton className="btn btn-primary w-fit">{a ? "Güncelle" : "Adresi kaydet"}</SubmitButton>
    </form>
  );
}
