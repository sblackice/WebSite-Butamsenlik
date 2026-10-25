/* eslint-disable @next/next/no-img-element */
// Plain <img>: product images are small SVG drawings or admin uploads served by /media.
// Swap for next/image once real photos live on a CDN.

export function isPlaceholder(url: string) {
  return url.startsWith("/demo/");
}

export function ProductImage({
  url,
  alt,
  className = "",
  showBadge = true,
  eager = false,
}: {
  url?: string | null;
  alt: string;
  className?: string;
  showBadge?: boolean;
  eager?: boolean;
}) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-sand ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
          width={800}
          height={800}
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-ink-soft">Görsel yok</div>
      )}
      {url && showBadge && isPlaceholder(url) && (
        <span className="absolute bottom-2 left-2 rounded-full bg-paper/85 px-2 py-0.5 text-[11px] text-ink-soft">
          Temsilî çizim
        </span>
      )}
    </div>
  );
}
