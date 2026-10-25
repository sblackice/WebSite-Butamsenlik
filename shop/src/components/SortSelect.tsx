"use client";

import { useRef } from "react";

export function SortSelect({ value, options }: { value: string; options: Record<string, string> }) {
  const ref = useRef<HTMLSelectElement>(null);
  return (
    <>
      <label htmlFor="sirala" className="sr-only">Sırala</label>
      <select
        ref={ref}
        id="sirala"
        name="sirala"
        defaultValue={value}
        className="select w-auto rounded-full py-1.5 text-sm"
        onChange={() => ref.current?.form?.requestSubmit()}
      >
        {Object.entries(options).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn btn-outline btn-sm">Uygula</button>
      </noscript>
    </>
  );
}
