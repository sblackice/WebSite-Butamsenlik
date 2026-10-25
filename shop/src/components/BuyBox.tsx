"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart, type CartActionState } from "@/app/actions/cart";
import { discountPercent, formatTRY } from "@/lib/money";
import { SubmitButton } from "./SubmitButton";

type Variant = { id: string; name: string; stock: number; priceDelta: number };

export function BuyBox({
  productId,
  price,
  compareAt,
  stock,
  variants,
  personalization,
  personalizationLabel,
  personalizationMax,
}: {
  productId: string;
  price: number;
  compareAt: number | null;
  stock: number;
  variants: Variant[];
  personalization: string;
  personalizationLabel: string | null;
  personalizationMax: number;
}) {
  const firstAvailable = variants.find((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<string>(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);
  const [state, action] = useActionState<CartActionState, FormData>(addToCart, null);

  const variant = variants.find((v) => v.id === variantId);
  const unit = price + (variant?.priceDelta ?? 0);
  const was = compareAt ? compareAt + (variant?.priceDelta ?? 0) : null;
  const available = variants.length ? (variant?.stock ?? 0) : stock;
  const pct = discountPercent(unit, was);
  const maxQty = Math.max(1, Math.min(20, available));

  return (
    <form id="buy-form" action={action} className="grid gap-5">
      <input type="hidden" name="productId" value={productId} />

      <div className="grid gap-1" aria-live="polite">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-3xl font-bold ${pct ? "text-danger" : ""}`}>{formatTRY(unit)}</span>
          {pct > 0 && was && (
            <>
              <s className="text-lg text-ink-soft">{formatTRY(was)}</s>
              <span className="badge bg-danger text-white">%{pct} indirim</span>
            </>
          )}
        </div>
        <p className={`text-sm font-semibold ${available > 0 ? (available <= 3 ? "text-gold-deep" : "text-success") : "text-danger"}`}>
          {available <= 0 ? "Tükendi" : available <= 3 ? `Son ${available} ürün` : "Stokta"}
        </p>
      </div>

      {variants.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="label mb-1">Seçenek: <span className="font-normal">{variant?.name ?? "seçin"}</span></legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`chip cursor-pointer select-none ${v.id === variantId ? "border-ink bg-ink text-ground" : ""} ${v.stock <= 0 ? "opacity-50 line-through" : "hover:border-ink"}`}
              >
                <input
                  type="radio"
                  name="variantId"
                  value={v.id}
                  checked={v.id === variantId}
                  disabled={v.stock <= 0}
                  onChange={() => { setVariantId(v.id); setQty(1); }}
                  className="sr-only"
                />
                {v.name}
                {v.priceDelta > 0 && <span className="text-xs opacity-80">+{formatTRY(v.priceDelta)}</span>}
                {v.stock <= 0 && <span className="sr-only">(tükendi)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {personalization !== "NONE" && (
        <div className="field">
          <label htmlFor="personalization" className="label">{personalizationLabel ?? "Kişiselleştirme"}</label>
          <input
            id="personalization"
            name="personalization"
            required
            maxLength={personalizationMax || 20}
            className={`input ${personalization === "LETTER" ? "w-24 text-center font-display text-2xl uppercase" : ""}`}
            placeholder={personalization === "LETTER" ? "B" : "Ada"}
            autoComplete="off"
          />
          <p className="hint">
            {personalization === "LETTER" ? "Tek harf yazın." : `En fazla ${personalizationMax} karakter. Kişiye özel ürünlerde iade koşulları farklı olabilir.`}
          </p>
        </div>
      )}

      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-line bg-paper">
          <button type="button" className="h-11 w-11 text-lg" aria-label="Adedi azalt" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
          <label htmlFor="quantity" className="sr-only">Adet</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
            className="w-12 bg-transparent text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button type="button" className="h-11 w-11 text-lg" aria-label="Adedi artır" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>
        </div>
        <SubmitButton className="btn btn-primary flex-1" disabled={available <= 0} pendingText="Ekleniyor…">
          {available <= 0 ? "Tükendi" : "Sepete ekle"}
        </SubmitButton>
      </div>

      {state && (
        <div role={state.ok ? "status" : "alert"} className={`alert ${state.ok ? "alert-success" : "alert-error"} flex flex-wrap items-center justify-between gap-2`}>
          <span>{state.message}</span>
          {state.ok && <Link href="/sepet" className="font-semibold underline">Sepete git</Link>}
        </div>
      )}

      {/* Mobile: price + buy button stay reachable */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ground/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-bold">{formatTRY(unit * qty)}</span>
        <button type="submit" className="btn btn-primary flex-1" disabled={available <= 0}>
          {available <= 0 ? "Tükendi" : "Sepete ekle"}
        </button>
      </div>
    </form>
  );
}
