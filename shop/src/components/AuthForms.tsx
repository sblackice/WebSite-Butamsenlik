"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, requestPasswordReset, resetPassword, changePassword, type AuthState } from "@/app/actions/auth";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

function Err({ state, name }: { state: AuthState; name: string }) {
  const e = state?.fields?.[name];
  return e ? <p id={`${name}-err`} className="text-sm text-danger">{e}</p> : null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(login, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="email" className="label">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.email ?? ""} />
      </div>
      <div className="field">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">Şifre</label>
          <Link href="/sifremi-unuttum" className="text-sm underline">Şifremi unuttum</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary btn-block" pendingText="Giriş yapılıyor…">Giriş yap</SubmitButton>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(register, null);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="name" className="label">Ad soyad</label>
        <input id="name" name="name" autoComplete="name" required className="input" defaultValue={state?.values?.name ?? ""} aria-invalid={!!state?.fields?.name || undefined} />
        <Err state={state} name="name" />
      </div>
      <div className="field">
        <label htmlFor="email" className="label">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.email ?? ""} aria-invalid={!!state?.fields?.email || undefined} />
        <Err state={state} name="email" />
      </div>
      <div className="field">
        <label htmlFor="phone" className="label">Cep telefonu <span className="font-normal text-ink-soft">(isteğe bağlı)</span></label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" defaultValue={state?.values?.phone ?? ""} />
        <Err state={state} name="phone" />
      </div>
      <div className="field">
        <label htmlFor="password" className="label">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" aria-describedby="pw-hint" />
        <p id="pw-hint" className="hint">En az 10 karakter, en az bir harf ve bir rakam.</p>
        <Err state={state} name="password" />
      </div>
      <div className="field">
        <label htmlFor="password2" className="label">Şifre (tekrar)</label>
        <input id="password2" name="password2" type="password" autoComplete="new-password" required className="input" />
        <Err state={state} name="password2" />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" className="checkbox mt-0.5" required />
        <span><Link href="/sayfa/kvkk" target="_blank" className="underline">KVKK aydınlatma metnini</Link> ve <Link href="/sayfa/gizlilik" target="_blank" className="underline">gizlilik politikasını</Link> okudum.</span>
      </label>
      <Err state={state} name="terms" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="marketing" className="checkbox mt-0.5" />
        <span>Kampanyalardan e-posta ile haberdar olmak istiyorum (isteğe bağlı).</span>
      </label>
      <SubmitButton className="btn btn-primary btn-block" pendingText="Hesap oluşturuluyor…">Üye ol</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, null);
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="email" className="label">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary btn-block" pendingText="Gönderiliyor…">Sıfırlama bağlantısı gönder</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPassword, null);
  if (state?.ok) {
    return (
      <div className="grid gap-4">
        <FormMessage state={state} />
        <Link href="/giris" className="btn btn-primary">Giriş yap</Link>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="password" className="label">Yeni şifre</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" />
        <p className="hint">En az 10 karakter, en az bir harf ve bir rakam.</p>
      </div>
      <div className="field">
        <label htmlFor="password2" className="label">Yeni şifre (tekrar)</label>
        <input id="password2" name="password2" type="password" autoComplete="new-password" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary btn-block">Şifremi güncelle</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(changePassword, null);
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="current" className="label">Mevcut şifre</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="password" className="label">Yeni şifre</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" />
        </div>
        <div className="field">
          <label htmlFor="password2" className="label">Yeni şifre (tekrar)</label>
          <input id="password2" name="password2" type="password" autoComplete="new-password" required className="input" />
        </div>
      </div>
      <SubmitButton className="btn btn-outline w-fit">Şifreyi değiştir</SubmitButton>
    </form>
  );
}
