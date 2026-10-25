// Pure price calculation, shared by cart and checkout. No database access here,
// so it can be unit tested. The server always recomputes totals; the browser never decides prices.

export type PricedLine = { unitPrice: number; quantity: number };

export type CouponRule = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usedCount?: number;
  isActive?: boolean;
};

export type ShippingRule = { fee: number; freeThreshold: number };

export type Totals = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  amountToFreeShipping: number;
};

export function checkCoupon(coupon: CouponRule, subtotal: number, now = new Date()): string | null {
  if (coupon.isActive === false) return "Bu indirim kodu artık geçerli değil.";
  if (coupon.startsAt && now < coupon.startsAt) return "Bu indirim kodu henüz başlamadı.";
  if (coupon.endsAt && now > coupon.endsAt) return "Bu indirim kodunun süresi doldu.";
  if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit)
    return "Bu indirim kodunun kullanım limiti doldu.";
  if (subtotal < coupon.minSubtotal) return "Sepet tutarı bu kod için yeterli değil.";
  return null;
}

export function couponDiscount(coupon: CouponRule, subtotal: number): number {
  const raw =
    coupon.type === "PERCENT"
      ? Math.round((subtotal * Math.min(Math.max(coupon.value, 0), 100)) / 100)
      : Math.max(coupon.value, 0);
  return Math.min(raw, subtotal);
}

export function computeTotals(
  lines: PricedLine[],
  coupon: CouponRule | null,
  shipping: ShippingRule,
  now = new Date(),
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  if (coupon) {
    couponError = checkCoupon(coupon, subtotal, now);
    if (!couponError) {
      discount = couponDiscount(coupon, subtotal);
      couponCode = coupon.code;
    }
  }

  const afterDiscount = subtotal - discount;
  // Free shipping is decided on the amount after discount.
  const isFree = lines.length === 0 || afterDiscount >= shipping.freeThreshold;
  const shippingFee = isFree ? 0 : shipping.fee;
  const amountToFreeShipping = isFree ? 0 : shipping.freeThreshold - afterDiscount;

  return {
    subtotal,
    discount,
    shippingFee,
    total: afterDiscount + shippingFee,
    couponCode,
    couponError,
    amountToFreeShipping,
  };
}
