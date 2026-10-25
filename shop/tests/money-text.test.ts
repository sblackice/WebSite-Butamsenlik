import assert from "node:assert/strict";
import { test } from "node:test";
import { discountPercent, formatTRY, parseTL, toTLInput } from "../src/lib/money";
import { normalizeSearch, slugify } from "../src/lib/text";

test("parseTL accepts Turkish and dot formats", () => {
  assert.equal(parseTL("1.249,90"), 124990);
  assert.equal(parseTL("1249.90"), 124990);
  assert.equal(parseTL("349,9"), 34990);
  assert.equal(parseTL("75"), 7500);
  assert.equal(parseTL("₺ 75 TL"), 7500);
  assert.equal(parseTL("abc"), null);
  assert.equal(parseTL("-5"), null);
  assert.equal(parseTL(""), null);
});

test("toTLInput round-trips", () => {
  assert.equal(toTLInput(124990), "1249,90");
  assert.equal(parseTL(toTLInput(124990)), 124990);
});

test("formatTRY uses Turkish format", () => {
  const s = formatTRY(124990);
  assert.match(s, /1\.249,90/);
  assert.match(s, /₺/);
});

test("discountPercent", () => {
  assert.equal(discountPercent(34990, 44990), 22);
  assert.equal(discountPercent(34990, null), 0);
  assert.equal(discountPercent(34990, 30000), 0);
});

test("Turkish search normalisation", () => {
  assert.equal(normalizeSearch("KÜPE"), "kupe");
  assert.equal(normalizeSearch("İnce Halka"), "ince halka");
  assert.equal(normalizeSearch("ışıltılı ÇELİK"), "isiltili celik");
  assert.equal(slugify("Kalpli Halhal!"), "kalpli-halhal");
});
