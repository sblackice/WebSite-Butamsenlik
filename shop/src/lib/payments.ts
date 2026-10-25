import "server-only";
import type { Settings } from "./settings";

/**
 * Payment methods.
 *
 * DEMO          – test flow only. No card data is collected and no money moves.
 *                 Enabled only when PAYMENT_PROVIDER=demo. Orders are flagged isTest.
 * BANK_TRANSFER – real flow without a payment provider: customer pays by IBAN,
 *                 admin marks the order as paid. Enabled when an IBAN is set in admin settings.
 *
 * Card payments (iyzico, PayTR, Stripe ...) are NOT integrated. To add one:
 *   1. add an id here and an entry in availablePaymentMethods(),
 *   2. create the provider's checkout session in nextPaymentStep(),
 *   3. add a webhook / callback route that verifies the provider's signature on the
 *      server and only then calls markOrderPaid(). Never trust the browser redirect alone.
 */
export type PaymentMethodId = "DEMO" | "BANK_TRANSFER";

export type PaymentMethod = { id: PaymentMethodId; label: string; description: string; isTest: boolean };

export function isDemoPaymentEnabled() {
  return process.env.PAYMENT_PROVIDER === "demo";
}

export function availablePaymentMethods(settings: Settings): PaymentMethod[] {
  const out: PaymentMethod[] = [];
  if (settings.bankIban.trim()) {
    out.push({
      id: "BANK_TRANSFER",
      label: "Havale / EFT",
      description: "Sipariş sonrası IBAN bilgisi gösterilir. Ödeme kontrol edilince sipariş hazırlanır.",
      isTest: false,
    });
  }
  if (isDemoPaymentEnabled()) {
    out.push({
      id: "DEMO",
      label: "Demo ödeme (TEST)",
      description: "Sadece deneme içindir. Kart bilgisi istenmez, para çekilmez, sipariş test olarak işaretlenir.",
      isTest: true,
    });
  }
  return out;
}

export function nextPaymentStep(order: { orderNumber: string; accessKey: string; paymentMethod: string }) {
  const q = `?t=${encodeURIComponent(order.accessKey)}`;
  if (order.paymentMethod === "DEMO") return `/odeme/demo/${order.orderNumber}${q}`;
  return `/siparis/${order.orderNumber}${q}`;
}
