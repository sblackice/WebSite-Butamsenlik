import "server-only";
import { cache } from "react";
import { prisma } from "./db";

// Defaults are placeholders for development. Change them from Admin → Vitrin & Ayarlar.
export const SETTING_DEFAULTS = {
  announcement: "Demo mağaza: ürünler ve fiyatlar örnektir | Kişiye özel takılarda harfini seç",
  shippingFee: "7500", // kuruş (demo value)
  freeShippingThreshold: "100000", // kuruş (demo value)
  shippingInfo: "Kargo süresi ve firması işletme tarafından belirlenmelidir.",
  returnInfo: "İade ve değişim koşulları için İade ve Değişim sayfasına bakın.",
  bankName: "",
  bankAccountName: "",
  bankIban: "",
  companyTitle: "",
  companyAddress: "",
  companyTaxOffice: "",
  companyTaxNumber: "",
  companyMersis: "",
  companyEmail: "",
  companyPhone: "",
  instagramUrl: "",
  whatsappNumber: "",
  brandStoryTitle: "Bu tam senlik.",
  brandStoryText:
    "Her gün takabileceğin, sana ait hissettiren parçalar. Harfini seç, rengini seç, kombinini kendin kur.",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const out = { ...SETTING_DEFAULTS } as Settings;
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});

export function shippingRule(s: Settings) {
  return {
    fee: Math.max(0, parseInt(s.shippingFee, 10) || 0),
    freeThreshold: Math.max(0, parseInt(s.freeShippingThreshold, 10) || 0),
  };
}
