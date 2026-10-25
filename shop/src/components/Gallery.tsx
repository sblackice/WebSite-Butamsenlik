"use client";

import { useState } from "react";
import { ProductImage } from "./ProductImage";

export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="grid gap-3">
      <ProductImage url={current?.url} alt={current?.alt || name} eager className="rounded-[var(--radius-card)]" />
      {images.length > 1 && (
        <ul className="flex gap-2" aria-label="Ürün görselleri">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Görsel ${i + 1}`}
                aria-current={i === active}
                className={`block w-20 overflow-hidden rounded-lg border-2 ${i === active ? "border-ink" : "border-transparent"}`}
              >
                <ProductImage url={img.url} alt="" showBadge={false} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
