"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import type { PaymentMethod } from "@/lib/payments";
import { SubmitButton } from "./SubmitButton";

type Defaults = Record<string, string>;
type SavedAddress = { id: string; title: string; fullName: string; phone: string; city: string; district: string; line: string; postalCode: string | null };

function Field({
  name, label, state, defaults, type = "text", autoComplete, required = true, className = "", inputMode, maxLength,
}: {
  name: string; label: string; state: CheckoutState; defaults: Defaults; type?: string; autoComplete?: string; required?: boolean; className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; maxLength?: number;
}) {
  const err = state?.fields?.[name];
  return (
    <div className={`field ${className}`}>
      <label htmlFor={name} className="label">{label}{!required && <span className="font-normal text-ink-soft"> (isteğe bağlı)</span>}</label>
      <input
        id={name} name={name} type={type} required={required} autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength}
        defaultValue={state?.values?.[name] ?? defaults[name] ?? ""}
        aria-invalid={err ? true : undefined} aria-describedby={err ? `${name}-err` : undefined}
        className="input"
      />
      {err && <p id={`${name}-err`} className="text-sm text-danger">{err}</p>}
    </div>
  );
}

export function CheckoutForm({ defaults, addresses, methods }: { defaults: Defaults; addresses: SavedAddress[]; methods: PaymentMethod[] }) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [billingSame, setBillingSame] = useState(state?.values ? state.values.billingSame === "on" : true);
  const [billingType, setBillingType] = useState(state?.values?.billingType ?? "INDIVIDUAL");
  const [addr, setAddr] = useState<Defaults>(defaults);
  const [formKey, setFormKey] = useState(0);

  const pickAddress = (id: string) => {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setAddr({ ...defaults, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postalCode ?? "" });
    setFormKey((k) => k + 1);
  };
  const d = { ...addr };

  return (
    <form action={action} className="grid gap-8" noValidate key={formKey}>
      {state?.message && <div role="alert" className="alert alert-error">{state.message}</div>}

      <section className="card grid gap-4 p-5" aria-labelledby="h-contact">
        <h2 id="h-contact" className="text-2xl">İletişim</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="email" label="E-posta" type="email" autoComplete="email" state={state} defaults={d} />
          <Field name="phone" label="Cep telefonu" type="tel" autoComplete="tel" inputMode="tel" state={state} defaults={d} />
        </div>
      </section>

      <section className="card grid gap-4 p-5" aria-labelledby="h-ship">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="h-ship" className="text-2xl">Teslimat adresi</h2>
          {addresses.length > 0 && (
            <select aria-label="Kayıtlı adres seç" className="select w-auto py-1.5 text-sm" defaultValue="" onChange={(e) => pickAddress(e.target.value)}>
              <option value="" disabled>Kayıtlı adreslerim</option>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.title} – {a.district}/{a.city}</option>)}
            </select>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="fullName" label="Ad soyad" autoComplete="name" state={state} defaults={d} className="sm:col-span-2" />
          <Field name="city" label="İl" autoComplete="address-level1" state={state} defaults={d} />
          <Field name="district" label="İlçe" autoComplete="address-level2" state={state} defaults={d} />
          <Field name="line" label="Açık adres (mahalle, sokak, no, daire)" autoComplete="street-address" state={state} defaults={d} className="sm:col-span-2" />
          <Field name="postalCode" label="Posta kodu" inputMode="numeric" maxLength={5} autoComplete="postal-code" required={false} state={state} defaults={d} />
        </div>
      </section>

      <section className="card grid gap-4 p-5" aria-labelledby="h-bill">
        <h2 id="h-bill" className="text-2xl">Fatura bilgileri</h2>
        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Fatura türü</legend>
          {[["INDIVIDUAL", "Bireysel"], ["CORPORATE", "Kurumsal"]].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="billingType" value={v} checked={billingType === v} onChange={() => setBillingType(v)} className="checkbox" />
              {l}
            </label>
          ))}
        </fieldset>
        {billingType === "CORPORATE" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="billName" label="Firma unvanı" state={state} defaults={d} className="sm:col-span-2" />
            <Field name="billTaxOffice" label="Vergi dairesi" state={state} defaults={d} />
            <Field name="billTaxNumber" label="Vergi numarası" inputMode="numeric" maxLength={10} state={state} defaults={d} />
          </div>
        ) : (
          <Field name="billTaxNumber" label="T.C. kimlik no" inputMode="numeric" maxLength={11} required={false} state={state} defaults={d} />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="billingSame" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="checkbox" />
          Fatura adresim teslimat adresiyle aynı
        </label>
        {!billingSame && (
          <div className="grid gap-4 sm:grid-cols-2">
            {billingType === "INDIVIDUAL" && <Field name="billName" label="Fatura adına ad soyad" state={state} defaults={d} className="sm:col-span-2" />}
            <Field name="billCity" label="İl" state={state} defaults={d} />
            <Field name="billDistrict" label="İlçe" state={state} defaults={d} />
            <Field name="billLine" label="Fatura adresi" state={state} defaults={d} className="sm:col-span-2" />
          </div>
        )}
      </section>

      <section className="card grid gap-4 p-5" aria-labelledby="h-pay">
        <h2 id="h-pay" className="text-2xl">Ödeme yöntemi</h2>
        {methods.length === 0 ? (
          <p className="alert alert-warning">
            Şu anda aktif ödeme yöntemi yok. Mağaza yöneticisinin bir ödeme yöntemi (ör. Havale/EFT IBAN bilgisi) tanımlaması gerekiyor.
          </p>
        ) : (
          <fieldset className="grid gap-3">
            <legend className="sr-only">Ödeme yöntemi</legend>
            {methods.map((m, i) => (
              <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${m.isTest ? "border-gold bg-warning-soft" : "border-line"}`}>
                <input type="radio" name="paymentMethod" value={m.id} defaultChecked={(state?.values?.paymentMethod ?? methods[0].id) === m.id || (i === 0 && !state)} className="checkbox mt-1" />
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="block text-sm text-ink-soft">{m.description}</span>
                </span>
              </label>
            ))}
            {state?.fields?.paymentMethod && <p className="text-sm text-danger">{state.fields.paymentMethod}</p>}
          </fieldset>
        )}
        <p className="text-xs text-ink-soft">Kredi kartı ile ödeme henüz bağlanmadı; kart bilgisi bu sitede istenmez ve saklanmaz.</p>
      </section>

      <section className="grid gap-3">
        <div className="field">
          <label htmlFor="note" className="label">Sipariş notu <span className="font-normal text-ink-soft">(isteğe bağlı)</span></label>
          <textarea id="note" name="note" maxLength={500} className="textarea" defaultValue={state?.values?.note ?? ""} />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="agreements" className="checkbox mt-0.5" required defaultChecked={state?.values?.agreements === "on"} />
          <span>
            <Link href="/sayfa/on-bilgilendirme" target="_blank" className="underline">Ön bilgilendirme formunu</Link> ve{" "}
            <Link href="/sayfa/mesafeli-satis" target="_blank" className="underline">mesafeli satış sözleşmesini</Link> okudum, onaylıyorum.{" "}
            Kişisel verilerin işlenmesi: <Link href="/sayfa/kvkk" target="_blank" className="underline">KVKK aydınlatma metni</Link>.
          </span>
        </label>
        {state?.fields?.agreements && <p className="text-sm text-danger">{state.fields.agreements}</p>}
        <SubmitButton className="btn btn-primary btn-block" disabled={methods.length === 0} pendingText="Sipariş oluşturuluyor…">
          Siparişi onayla
        </SubmitButton>
      </section>
    </form>
  );
}
