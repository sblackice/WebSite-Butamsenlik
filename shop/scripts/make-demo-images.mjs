// Generates placeholder product drawings (SVG) into public/demo.
// They are illustrations, not product photos, and every file says so.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const symbols = JSON.parse(readFileSync(new URL("./jewelry-symbols.json", import.meta.url), "utf8"));
const out = new URL("../public/demo/", import.meta.url);
mkdirSync(out, { recursive: true });

const metals = {
  altin: ["#B0894F", "#E2C99A"],
  rose: ["#B5776B", "#EBC2B4"],
  gumus: ["#858A92", "#DADDE2"],
  celik: ["#6F747B", "#C9CDD3"],
};
const tones = { blush: "#EEDFD8", sage: "#DFE5DC", mist: "#E3E4E8", sand: "#ECE3D6" };
const text = { letter: "B", name: "Ada" };

let n = 0;
for (const [shape, body] of Object.entries(symbols)) {
  for (const [metal, [m, ml]] of Object.entries(metals)) {
    for (const [tone, bg] of Object.entries(tones)) {
      const inner = body
        .replaceAll("var(--metal-light)", ml)
        .replaceAll("var(--metal)", m)
        .replaceAll("var(--stone)", "#E7B9B3")
        .replaceAll("var(--ink)", "#34292A")
        .replaceAll("{L}", text[shape] ?? "");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="Temsilî takı çizimi">
<defs><radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="800" fill="${bg}"/><rect width="800" height="800" fill="url(#g)"/>
<g transform="translate(160 150) scale(2.4)">${inner}</g>
<text x="772" y="776" text-anchor="end" font-family="Arial, sans-serif" font-size="20" fill="#6B5D5A" opacity=".7">temsilî çizim</text>
</svg>\n`;
      writeFileSync(new URL(`${shape}-${metal}-${tone}.svg`, out), svg);
      n++;
    }
  }
}
console.log(`${n} demo drawings written to public/demo`);
