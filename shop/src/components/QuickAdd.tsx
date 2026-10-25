"use client";

import { useActionState } from "react";
import { addToCart, type CartActionState } from "@/app/actions/cart";
import { SubmitButton } from "./SubmitButton";

export function QuickAdd({ productId, name }: { productId: string; name: string }) {
  const [state, action] = useActionState<CartActionState, FormData>(addToCart, null);
  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <SubmitButton className="btn btn-outline btn-sm btn-block" pendingText="Ekleniyor…" aria-label={`${name} sepete ekle`}>
        Sepete ekle
      </SubmitButton>
      <p role="status" aria-live="polite" className={`min-h-[1.1rem] text-xs ${state?.ok ? "text-success" : "text-danger"}`}>
        {state?.message}
      </p>
    </form>
  );
}
