// Money helpers. All amounts are integer kuruş (1 TL = 100 kuruş).

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatTRY(kurus: number): string {
  return formatter.format(kurus / 100);
}

/** Parses "1.249,90", "1249.90" or "1249" (TL) into kuruş. Returns null if invalid. */
export function parseTL(input: string | null | undefined): number | null {
  if (input == null) return null;
  let s = String(input).trim().replace(/\s|₺|TL/gi, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** kuruş -> "1249,90" for form inputs */
export function toTLInput(kurus: number | null | undefined): string {
  if (kurus == null) return "";
  return (kurus / 100).toFixed(2).replace(".", ",");
}

export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
