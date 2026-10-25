import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCoupon, computeTotals, couponDiscount, type CouponRule } from "../src/lib/pricing";

const ship = { fee: 7500, freeThreshold: 100000 };
const pct10: CouponRule = { code: "HOS10", type: "PERCENT", value: 10, minSubtotal: 0 };

test("subtotal and paid shipping under threshold", () => {
  const t = computeTotals([{ unitPrice: 34990, quantity: 2 }], null, ship);
  assert.equal(t.subtotal, 69980);
  assert.equal(t.shippingFee, 7500);
  assert.equal(t.total, 77480);
  assert.equal(t.amountToFreeShipping, 100000 - 69980);
});

test("free shipping at or above threshold", () => {
  const t = computeTotals([{ unitPrice: 50000, quantity: 2 }], null, ship);
  assert.equal(t.shippingFee, 0);
  assert.equal(t.total, 100000);
});

test("free shipping is decided after the discount", () => {
  const t = computeTotals([{ unitPrice: 105000, quantity: 1 }], pct10, ship);
  assert.equal(t.discount, 10500);
  assert.equal(t.shippingFee, 7500); // 94.500 < 100.000
  assert.equal(t.total, 105000 - 10500 + 7500);
});

test("percent coupon rounds to whole kuruş", () => {
  assert.equal(couponDiscount({ ...pct10, value: 15 }, 33333), 5000);
});

test("fixed coupon never exceeds subtotal", () => {
  assert.equal(couponDiscount({ code: "X", type: "FIXED", value: 50000, minSubtotal: 0 }, 20000), 20000);
});

test("coupon rules: minimum, dates, limit, inactive", () => {
  const now = new Date("2026-06-01T12:00:00Z");
  assert.match(checkCoupon({ ...pct10, minSubtotal: 50000 }, 10000, now)!, /yeterli değil/);
  assert.match(checkCoupon({ ...pct10, endsAt: new Date("2026-05-01") }, 10000, now)!, /süresi doldu/);
  assert.match(checkCoupon({ ...pct10, startsAt: new Date("2026-07-01") }, 10000, now)!, /henüz/);
  assert.match(checkCoupon({ ...pct10, usageLimit: 3, usedCount: 3 }, 10000, now)!, /limiti/);
  assert.match(checkCoupon({ ...pct10, isActive: false }, 10000, now)!, /geçerli değil/);
  assert.equal(checkCoupon(pct10, 10000, now), null);
});

test("invalid coupon is reported and not applied", () => {
  const t = computeTotals([{ unitPrice: 10000, quantity: 1 }], { ...pct10, minSubtotal: 50000 }, ship);
  assert.equal(t.discount, 0);
  assert.equal(t.couponCode, null);
  assert.ok(t.couponError);
});

test("empty cart costs nothing", () => {
  const t = computeTotals([], null, ship);
  assert.deepEqual([t.subtotal, t.shippingFee, t.total], [0, 0, 0]);
});
