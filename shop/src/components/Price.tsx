import { discountPercent, formatTRY } from "@/lib/money";

export function Price({ price, compareAt, size = "md" }: { price: number; compareAt?: number | null; size?: "md" | "lg" }) {
  const pct = discountPercent(price, compareAt);
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {pct > 0 && compareAt ? (
        <>
          <span className={`font-bold text-danger ${big ? "text-2xl" : "text-base"}`}>{formatTRY(price)}</span>
          <s className={`text-ink-soft ${big ? "text-base" : "text-sm"}`} aria-label={`Eski fiyat ${formatTRY(compareAt)}`}>
            {formatTRY(compareAt)}
          </s>
          {big && <span className="badge bg-danger text-white">%{pct} indirim</span>}
        </>
      ) : (
        <span className={`font-bold ${big ? "text-2xl" : "text-base"}`}>{formatTRY(price)}</span>
      )}
    </div>
  );
}
