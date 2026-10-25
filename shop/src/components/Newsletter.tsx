"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter, type FormState } from "@/app/actions/forms";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function Newsletter() {
  const [state, action] = useActionState<FormState, FormData>(subscribeNewsletter, null);
  return (
    <form action={action} className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">E-posta adresiniz</label>
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="E-posta adresiniz" className="input rounded-full" />
        <SubmitButton pendingText="Gönderiliyor…">Abone ol</SubmitButton>
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="consent" className="checkbox mt-0.5" required />
        <span>
          Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum. <Link href="/sayfa/kvkk" className="underline">KVKK aydınlatma metni</Link>
        </span>
      </label>
      <FormMessage state={state} />
    </form>
  );
}
