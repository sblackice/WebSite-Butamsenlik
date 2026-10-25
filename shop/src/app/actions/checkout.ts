"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findCart, loadCoupon, toLines } from "@/lib/cart";
import { newAccessKey, newOrderNumber } from "@/lib/orders";
import { availablePaymentMethods, nextPaymentStep } from "@/lib/payments";
import { computeTotals } from "@/lib/pricing";
import { getSettings, shippingRule } from "@/lib/settings";
import { addressSchema, emailSchema, firstError, phoneSchema } from "@/lib/validation";

export type CheckoutState = { ok: false; message: string; fields?: Record<string, string>; values?: Record<string, string> } | null;

const schema = z
  .object({
    email: emailSchema,
    phone: phoneSchema,
    fullName: addressSchema.shape.fullName,
    city: addressSchema.shape.city,
    district: addressSchema.shape.district,
    line: addressSchema.shape.line,
    postalCode: addressSchema.shape.postalCode,
    billingSame: z.string().optional(),
    billingType: z.enum(["INDIVIDUAL", "CORPORATE"]).default("INDIVIDUAL"),
    billName: z.string().trim().max(120).optional(),
    billCity: z.string().trim().max(40).optional(),
    billDistrict: z.string().trim().max(60).optional(),
    billLine: z.string().trim().max(250).optional(),
    billTaxOffice: z.string().trim().max(60).optional(),
    billTaxNumber: z.string().trim().max(11).optional(),
    note: z.string().trim().max(500).optional(),
    paymentMethod: z.string(),
    agreements: z.literal("on", { message: "Ön bilgilendirme formu ve mesafeli satış sözleşmesini onaylamanız gerekir." }),
  })
  .superRefine((v, ctx) => {
    const same = v.billingSame === "on";
    if (v.billingType === "CORPORATE") {
      if (!v.billName || v.billName.length < 2) ctx.addIssue({ code: "custom", path: ["billName"], message: "Firma unvanını yazın." });
      if (!v.billTaxOffice) ctx.addIssue({ code: "custom", path: ["billTaxOffice"], message: "Vergi dairesini yazın." });
      if (!/^\d{10}$/.test(v.billTaxNumber ?? "")) ctx.addIssue({ code: "custom", path: ["billTaxNumber"], message: "Vergi numarası 10 haneli olmalı." });
    } else if (v.billTaxNumber && !/^\d{11}$/.test(v.billTaxNumber)) {
      ctx.addIssue({ code: "custom", path: ["billTaxNumber"], message: "T.C. kimlik numarası 11 haneli olmalı." });
    }
    if (!same) {
      if (!v.billCity) ctx.addIssue({ code: "custom", path: ["billCity"], message: "Fatura ili yazın." });
      if (!v.billDistrict) ctx.addIssue({ code: "custom", path: ["billDistrict"], message: "Fatura ilçesini yazın." });
      if (!v.billLine || v.billLine.length < 10) ctx.addIssue({ code: "custom", path: ["billLine"], message: "Fatura adresini yazın." });
      if (v.billingType === "INDIVIDUAL" && (!v.billName || v.billName.length < 3)) ctx.addIssue({ code: "custom", path: ["billName"], message: "Fatura adına ad soyad yazın." });
    }
  });

class StockError extends Error {}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const fail = (message: string, fields?: Record<string, string>): CheckoutState => ({ ok: false, message, fields, values });

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const e = firstError(parsed.error);
    return fail(e.message, e.fields);
  }
  const v = parsed.data;

  const [user, settings, cart] = await Promise.all([getCurrentUser(), getSettings(), findCart()]);
  const methods = availablePaymentMethods(settings);
  const method = methods.find((m) => m.id === v.paymentMethod);
  if (!method) return fail("Lütfen geçerli bir ödeme yöntemi seçin.", { paymentMethod: "Ödeme yöntemi seçin." });

  const lines = toLines(cart);
  if (!cart || !lines.length) return fail("Sepetiniz boş.");
  if (lines.some((l) => l.issue)) return fail("Sepetinizde stok veya ürün uyarısı var. Lütfen sepete dönüp düzeltin.");

  const coupon = await loadCoupon(cart.couponCode);
  const totals = computeTotals(lines, coupon, shippingRule(settings));

  const same = v.billingSame === "on";
  const orderNumber = newOrderNumber();
  const accessKey = newAccessKey();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Reserve stock with conditional updates so two buyers cannot take the last item.
      for (const l of lines) {
        const res = l.variantId
          ? await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } })
          : await tx.product.updateMany({ where: { id: l.productId, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } });
        if (res.count !== 1) throw new StockError(`${l.name} için yeterli stok kalmadı.`);
      }
      if (totals.couponCode) {
        const c = await tx.coupon.findUnique({ where: { code: totals.couponCode } });
        if (c) {
          const res = await tx.coupon.updateMany({
            where: { id: c.id, ...(c.usageLimit != null ? { usedCount: { lt: c.usageLimit } } : {}) },
            data: { usedCount: { increment: 1 } },
          });
          if (res.count !== 1) throw new StockError("İndirim kodunun kullanım limiti doldu.");
        }
      }
      const created = await tx.order.create({
        data: {
          orderNumber,
          accessKey,
          userId: user?.id ?? null,
          email: v.email,
          phone: v.phone,
          status: "PENDING_PAYMENT",
          subtotal: totals.subtotal,
          discount: totals.discount,
          shippingFee: totals.shippingFee,
          total: totals.total,
          couponCode: totals.couponCode,
          shipName: v.fullName,
          shipCity: v.city,
          shipDistrict: v.district,
          shipLine: v.line,
          shipPostalCode: v.postalCode || null,
          billingType: v.billingType,
          billName: v.billName || v.fullName,
          billCity: same ? v.city : v.billCity!,
          billDistrict: same ? v.district : v.billDistrict!,
          billLine: same ? v.line : v.billLine!,
          billTaxOffice: v.billTaxOffice || null,
          billTaxNumber: v.billTaxNumber || null,
          note: v.note || null,
          paymentMethod: method.id,
          isTest: method.isTest,
          agreementsAt: new Date(),
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              variantName: l.variantName,
              personalization: l.personalization,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          events: { create: { status: "PENDING_PAYMENT", note: method.isTest ? "Test siparişi oluşturuldu." : "Sipariş oluşturuldu." } },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
      return created;
    });
  } catch (e) {
    if (e instanceof StockError) return fail(e.message);
    console.error("placeOrder failed", e);
    return fail("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
  }

  revalidatePath("/", "layout");
  redirect(nextPaymentStep(order));
}
