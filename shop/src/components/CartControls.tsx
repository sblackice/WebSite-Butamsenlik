"use client";

import { useActionState, useRef } from "react";
import { applyCoupon, removeCoupon, updateCartItem, type CartActionState } from "@/app/actions/cart";
import { SubmitButton } from "./SubmitButton";

export function QuantityForm({ itemId, quantity, max }: { itemId: string; quantity: number; max: number }) {
  const ref = useRef<HTMLFormElement>(null);
  const options = Array.from({ length: Math.max(quantity, Math.min(20, Math.max(1, max))) }, (_, i) => i + 1);
  return (
    <form ref={ref} action={updateCartItem} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <label htmlFor={`q-${itemId}`} className="sr-only">Adet</label>
      <select id={`q-${itemId}`} name="quantity" defaultValue={quantity} className="select w-20 py-1" onChange={() => ref.current?.requestSubmit()}>
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <noscript><button className="btn btn-ghost btn-sm" type="submit">Güncelle</button></noscript>
    </form>
  );
}

export function CouponForm({ applied, error }: { applied: string | null; error: string | null }) {
  const [state, action] = useActionState<CartActionState, FormData>(applyCoupon, null);
  if (applied) {
    return (
      <form action={removeCoupon} className="flex items-center justify-between gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
        <span>İndirim kodu: <strong>{applied}</strong></span>
        <button type="submit" className="font-semibold underline">Kaldır</button>
      </form>
    );
  }
  return (
    <form action={action} className="grid gap-2">
      <label htmlFor="coupon" className="label">İndirim kodu</label>
      <div className="flex gap-2">
        <input id="coupon" name="code" className="input uppercase" maxLength={30} autoComplete="off" />
        <SubmitButton className="btn btn-outline" pendingText="…">Uygula</SubmitButton>
      </div>
      {(state?.message || error) && (
        <p role="alert" className={`text-sm ${state?.ok ? "text-success" : "text-danger"}`}>{state?.message ?? error}</p>
      )}
    </form>
  );
}
