// E2E test of the storefront (customer flows). Run against a running server.
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3100";
const results = [];
const ok = (name, cond, extra = "") => { results.push([cond ? "PASS" : "FAIL", name, extra]); };
const money = (s) => Number(s.replace(/[^\d,]/g, "").replace(",", "."));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  // 1. Link crawl from home: every internal link should answer 200
  await page.goto(BASE + "/");
  ok("home h1 + lang", (await page.locator("h1").count()) === 1 && (await page.getAttribute("html", "lang")) === "tr");
  const hrefs = [...new Set(await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href"))))];
  const bad = [];
  for (const h of hrefs) {
    const r = await ctx.request.get(BASE + h, { maxRedirects: 5 });
    if (r.status() !== 200) bad.push(`${h} -> ${r.status()}`);
  }
  ok(`home links (${hrefs.length}) all 200`, bad.length === 0, bad.join(", "));
  const imgsNoAlt = await page.$$eval("img", (is) => is.filter((i) => !i.hasAttribute("alt")).length);
  ok("all images have alt attribute", imgsNoAlt === 0, String(imgsNoAlt));

  // 2. Desktop dropdown menu shows subcategories on hover
  await page.hover("nav[aria-label='Kategoriler'] >> text=Kolye");
  await page.waitForTimeout(300);
  ok("dropdown shows subcategory", await page.isVisible("nav[aria-label='Kategoriler'] >> text=Taşlı Kolye"));

  // 3. Search with Turkish characters / case
  await page.fill("#q-desktop", "KÜPE");
  await page.press("#q-desktop", "Enter");
  await page.waitForURL(/arama/);
  const searchCount = await page.locator("main article").count();
  ok("search 'KÜPE' finds products", searchCount >= 4, `${searchCount} results`);

  // 4. Sort by price ascending is ordered
  await page.goto(BASE + "/kategori/kolye?sirala=fiyat-artan");
  const prices = await page.$$eval("main article", (as) => as.map((a) => a.querySelector("span.font-bold")?.textContent ?? ""));
  const nums = prices.map(money);
  ok("sort price asc ordered", nums.length > 2 && nums.every((n, i) => i === 0 || n >= nums[i - 1]), nums.join(" "));
  await page.goto(BASE + "/kategori/kolye?sirala=fiyat-azalan");
  const nums2 = (await page.$$eval("main article", (as) => as.map((a) => a.querySelector("span.font-bold")?.textContent ?? ""))).map(money);
  ok("sort price desc ordered", nums2.every((n, i) => i === 0 || n <= nums2[i - 1]));

  // 5. Price + stock filters and chips
  await page.goto(BASE + "/urunler?max=400&stok=1");
  const n3 = (await page.$$eval("main article", (as) => as.map((a) => a.querySelector("span.font-bold")?.textContent ?? ""))).map(money);
  ok("max price filter respected", n3.length > 0 && n3.every((n) => n <= 400), n3.join(" "));
  ok("no sold-out in stock filter", (await page.locator("main article >> text=Tükendi").count()) === 0);
  ok("active filter chips shown", (await page.locator("[aria-label='Aktif filtreler'] a").count()) >= 3);
  await page.click("text=Tümünü temizle");
  await page.waitForURL(BASE + "/urunler");
  ok("clear filters", (await page.locator("[aria-label='Aktif filtreler']").count()) === 0);

  // 6. Pagination: 33 demo products, 12 per page
  await page.goto(BASE + "/urunler");
  const pagesNav = await page.locator("nav[aria-label='Sayfalar'] a").count();
  ok("pagination present", pagesNav >= 3, String(pagesNav));
  await page.goto(BASE + "/urunler?sayfa=3");
  ok("page 3 has remaining items", (await page.locator("main article").count()) === 9);

  // 7. Subcategory listing only shows its products
  await page.goto(BASE + "/kategori/halka-kupe");
  ok("subcategory count", (await page.locator("main article").count()) === 2);

  // 8. Product with variants + letter personalisation
  await page.goto(BASE + "/urun/harf-kolye");
  await page.evaluate(() => document.getElementById("personalization").removeAttribute("required"));
  await page.locator("form#buy-form").getByRole("button", { name: "Sepete ekle" }).first().click();
  await page.locator("form#buy-form [role=alert]").waitFor();
  ok("letter required message (server check)", (await page.locator("form#buy-form [role=alert]").textContent()).includes("harf"));
  await page.fill("#personalization", "ş");
  await page.click("label:has-text('Rose renk / 45 cm')");
  await page.click("#quantity ~ button[aria-label='Adedi artır']");
  await page.locator("form#buy-form").getByRole("button", { name: "Sepete ekle" }).first().click();
  await page.waitForSelector("text=Sepete eklendi");
  ok("variant product added", true);
  ok("cart badge shows 2", (await page.getAttribute("a[href='/sepet']", "aria-label")).includes("2"));

  // 9. Quick add from a card (simple product)
  await page.goto(BASE + "/kategori/halka-kupe");
  const card = page.locator("article:has-text('Halka Küpe Gümüş')");
  await card.getByRole("button", { name: /sepete ekle/i }).click();
  await card.locator("text=Sepete eklendi").waitFor();
  ok("quick add works", true);

  // 10. Over-stock is refused (Kıkırdak Halka stock 2)
  await page.goto(BASE + "/urun/kikirdak-halka");
  await page.fill("#quantity", "5");
  ok("qty input capped by stock", (await page.inputValue("#quantity")) === "2");

  // 11. Cart math + coupon
  await page.goto(BASE + "/sepet");
  const lineTotals = (await page.$$eval("ul[aria-label='Sepetteki ürünler'] > li p.font-bold", (ps) => ps.map((p) => p.textContent))).map(money);
  const sub = money(await page.textContent("dl >> text=Ara toplam >> xpath=../dd"));
  ok("subtotal = sum of lines", Math.abs(sub - lineTotals.reduce((a, b) => a + b, 0)) < 0.01, `${sub} vs ${lineTotals}`);
  // Rose 45 cm: base 449.90 x2 = 899.80 ; halka gümüş 279.90 => 1179.70
  ok("expected subtotal 1179,70", Math.abs(sub - 1179.7) < 0.01, String(sub));
  ok("free shipping over 1000", (await page.textContent("dl >> text=Kargo >> xpath=../dd")).includes("Ücretsiz"));
  await page.fill("#coupon", "YOKBOYLE");
  await page.click("button:has-text('Uygula')");
  await page.waitForSelector("text=bulunamadı");
  ok("invalid coupon error", true);
  await page.fill("#coupon", "hosgeldin10");
  await page.click("button:has-text('Uygula')");
  await page.waitForSelector("text=İndirim kodu:");
  const disc = money(await page.textContent("dl >> text=/İndirim/ >> xpath=../dd"));
  const total = money(await page.textContent('dl >> text="Toplam" >> xpath=../dd'));
  ok("10% discount = 117,97", Math.abs(disc - 117.97) < 0.01, String(disc));
  ok("total after discount, still free shipping (1061,73 ≥ 1000)", Math.abs(total - (1179.7 - 117.97)) < 0.01, String(total));
  // change qty of the earring to 2 → recalculated
  const qSel = page.locator("ul[aria-label='Sepetteki ürünler'] > li:has-text('Halka Küpe Gümüş') select");
  await qSel.selectOption("2");
  await page.waitForFunction(() => document.body.innerText.includes("1.459,60"));
  ok("quantity change recalculates", true);

  // 12. Checkout validation
  await page.click("text=Siparişi tamamla");
  await page.waitForURL(/odeme/);
  await page.click("button:has-text('Siparişi onayla')");
  await page.waitForSelector("[role=alert]");
  ok("checkout validation shows errors", (await page.locator("[aria-invalid=true]").count()) > 0 || (await page.textContent("[role=alert]")).length > 0);

  await page.fill("#email", "test.musteri@example.com");
  await page.fill("#phone", "0555 111 22 33");
  await page.fill("#fullName", "Test Müşteri");
  await page.fill("#city", "İstanbul");
  await page.fill("#district", "Kadıköy");
  await page.fill("#line", "Örnek Mah. Deneme Sok. No:1 D:2");
  await page.click("label:has-text('Demo ödeme (TEST)')");
  await page.click("button:has-text('Siparişi onayla')");
  await page.waitForSelector("text=onaylamanız gerekir");
  ok("agreements required", true);
  ok("form values kept after error", (await page.inputValue("#email")) === "test.musteri@example.com");
  await page.check("input[name=agreements]");
  await page.click("button:has-text('Siparişi onayla')");
  await page.waitForURL(/odeme\/demo/);
  ok("demo payment page clearly labeled", (await page.textContent("main")).includes("gerçek bir ödeme sağlayıcısı"));
  await page.click("button:has-text('Test ödemesini onayla')");
  await page.waitForURL(/siparis\//);
  const orderText = await page.textContent("main");
  ok("order paid + marked TEST", orderText.includes("TEST SİPARİŞİ") && orderText.includes("Ödendi"));
  const orderUrl = page.url();
  ok("cart emptied after order", (await page.getAttribute("a[href='/sepet']", "aria-label")).includes("0"));

  // 13. Order page is private: without key → 404
  const noKey = await ctx.request.get(orderUrl.split("?")[0]);
  const ctx2 = await browser.newContext();
  const r2 = await ctx2.request.get(orderUrl.split("?")[0]);
  const r3 = await ctx2.request.get(orderUrl.split("?")[0] + "?t=wrongkey");
  ok("order hidden without key", r2.status() === 404 && r3.status() === 404, `${r2.status()} ${r3.status()} (same-browser ${noKey.status()})`);

  // 14. Register, logout, login, wrong password
  await page.goto(BASE + "/uye-ol");
  await page.fill("#name", "Ayşe Deneme");
  await page.fill("#email", "ayse@example.com");
  await page.fill("#password", "kisa");
  await page.fill("#password2", "kisa");
  await page.check("input[name=terms]");
  await page.click("button:has-text('Üye ol')");
  await page.waitForSelector("text=en az 10 karakter");
  ok("weak password rejected", true);
  await page.fill("#password", "Guvenli-Sifre-2026");
  await page.fill("#password2", "Guvenli-Sifre-2026");
  await page.check("input[name=terms]");
  await page.click("button:has-text('Üye ol')");
  await page.waitForURL(/hesabim/);
  ok("registered + logged in", (await page.textContent("h1")).includes("Ayşe"));
  // address
  await page.goto(BASE + "/hesabim/adresler");
  await page.fill("#new-title", "Ev");
  await page.fill("#new-fullName", "Ayşe Deneme");
  await page.fill("#new-phone", "05551112233");
  await page.fill("#new-city", "İzmir");
  await page.fill("#new-district", "Karşıyaka");
  await page.fill("#new-line", "Deneme Mah. 123. Sok. No:4");
  await page.click("button:has-text('Adresi kaydet')");
  await page.waitForSelector("text=Adres kaydedildi");
  ok("address saved", (await page.locator("main details.card").count()) === 1);
  // favorite
  await page.goto(BASE + "/urun/inci-kupe");
  await page.click("button:has-text('Favorilere ekle')");
  await page.waitForSelector("button:has-text('Favorilerde')");
  await page.goto(BASE + "/hesabim/favoriler");
  ok("favorite listed", (await page.locator("main article").count()) === 1);
  // non-admin cannot see admin
  await page.goto(BASE + "/admin");
  ok("customer redirected away from /admin", !page.url().includes("/admin"), page.url());
  const csv = await ctx.request.get(BASE + "/admin/bulten");
  ok("customer blocked from CSV export", csv.status() === 403, String(csv.status()));
  // logout + wrong password + login
  await page.goto(BASE + "/hesabim");
  await page.click("button:has-text('Çıkış yap')");
  await page.goto(BASE + "/giris");
  await page.fill("#email", "ayse@example.com");
  await page.fill("#password", "yanlis-sifre-1");
  await page.click("button:has-text('Giriş yap')");
  await page.waitForSelector("text=E-posta veya şifre hatalı");
  ok("wrong password message", true);
  await page.fill("#password", "Guvenli-Sifre-2026");
  await page.click("button:has-text('Giriş yap')");
  await page.waitForURL(/hesabim/);
  ok("login works", true);
  await page.click("button:has-text('Çıkış yap')");

  // 15. Open redirect blocked
  await page.goto(BASE + "/giris?next=//evil.example.com");
  await page.fill("#email", "ayse@example.com");
  await page.fill("#password", "Guvenli-Sifre-2026");
  await page.click("button:has-text('Giriş yap')");
  await page.waitForLoadState("networkidle");
  ok("open redirect blocked", page.url().startsWith(BASE), page.url());
  await page.goto(BASE + "/hesabim");
  await page.click("button:has-text('Çıkış yap')");

  // 16. Password reset (mail printed to server log in this test run)
  await page.goto(BASE + "/sifremi-unuttum");
  await page.fill("#email", "ayse@example.com");
  await page.click("button:has-text('Sıfırlama bağlantısı')");
  await page.waitForSelector("text=kayıtlı bir hesap varsa");
  ok("reset request generic message", true);
  await page.fill("#email", "olmayan@example.com");
  await page.click("button:has-text('Sıfırlama bağlantısı')");
  await page.waitForSelector("text=kayıtlı bir hesap varsa");
  ok("unknown email gets same message (no account enumeration)", true);
  const fs = require("fs");
  await page.waitForTimeout(300);
  const log = fs.readFileSync(process.env.LOG, "utf8");
  const m = [...log.matchAll(/sifre-sifirla\?token=([A-Za-z0-9_-]+)/g)].pop();
  ok("reset mail produced", !!m);
  if (m) {
    await page.goto(BASE + "/sifre-sifirla?token=" + m[1]);
    await page.fill("#password", "Yeni-Sifre-2026");
    await page.fill("#password2", "Yeni-Sifre-2026");
    await page.click("button:has-text('Şifremi güncelle')");
    await page.waitForSelector("text=Şifreniz güncellendi");
    ok("password reset works", true);
    await page.goto(BASE + "/sifre-sifirla?token=" + m[1]);
    await page.fill("#password", "Baska-Sifre-2026");
    await page.fill("#password2", "Baska-Sifre-2026");
    await page.click("button:has-text('Şifremi güncelle')");
    await page.waitForSelector("text=geçersiz veya süresi dolmuş");
    ok("reset token single-use", true);
    await page.goto(BASE + "/giris");
    await page.fill("#email", "ayse@example.com");
    await page.fill("#password", "Yeni-Sifre-2026");
    await page.click("button:has-text('Giriş yap')");
    await page.waitForURL(/hesabim/);
    ok("login with new password", true);
  }

  // 17. Newsletter + contact form
  await page.goto(BASE + "/sayfa/iletisim");
  await page.fill("#c-name", "Deneme");
  await page.fill("#c-email", "d@example.com");
  await page.fill("#c-subject", "Soru");
  await page.fill("#c-message", "Kişiye özel kolye hakkında bilgi almak istiyorum.");
  await page.check("form:has(#c-name) input[name=consent]");
  await page.click("form:has(#c-name) button:has-text('Gönder')");
  await page.waitForSelector("text=Mesajınız alındı");
  ok("contact form", true);
  await page.fill("#nl-email", "bulten@example.com");
  await page.check("form:has(#nl-email) input[name=consent]");
  await page.click("button:has-text('Abone ol')");
  await page.waitForSelector("text=bültene kaydoldunuz");
  ok("newsletter", true);

  ok("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  await browser.close();
  for (const r of results) console.log(r.join("  "));
  console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} passed`);
})().catch((e) => { for (const r of results) console.log(r.join("  ")); console.error("CRASH:", e.message); process.exit(1); });
