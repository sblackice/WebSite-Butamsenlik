"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type FormState } from "@/app/actions/forms";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(sendContact, null);
  return (
    <form action={action} className="card grid gap-4 p-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field"><label htmlFor="c-name" className="label">Ad soyad</label><input id="c-name" name="name" defaultValue={state?.values?.name ?? ""} required className="input" autoComplete="name" /></div>
        <div className="field"><label htmlFor="c-email" className="label">E-posta</label><input id="c-email" name="email" defaultValue={state?.values?.email ?? ""} type="email" required className="input" autoComplete="email" /></div>
      </div>
      <div className="field"><label htmlFor="c-subject" className="label">Konu</label><input id="c-subject" name="subject" defaultValue={state?.values?.subject ?? ""} required className="input" maxLength={120} /></div>
      <div className="field"><label htmlFor="c-message" className="label">Mesajınız</label><textarea id="c-message" name="message" defaultValue={state?.values?.message ?? ""} required className="textarea" maxLength={3000} /></div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent" required className="checkbox mt-0.5" /><span><Link href="/sayfa/kvkk" className="underline">KVKK aydınlatma metnini</Link> okudum.</span></label>
      <SubmitButton className="btn btn-primary w-fit">Gönder</SubmitButton>
    </form>
  );
}
