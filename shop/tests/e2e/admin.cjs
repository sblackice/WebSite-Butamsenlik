const { chromium } = require("playwright");
const path = require("path");
const BASE = process.env.BASE || "http://localhost:3100";
const results = [];
const ok = (n, c, x = "") => results.push([c ? "PASS" : "FAIL", n, x]);

(async () => {
  const browser = await chromium.launch();
  const admin = await (await browser.newContext()).newPage();
  const errors = [];
  admin.on("pageerror", (e) => errors.push(String(e)));

  // guest cannot open admin
  const guest = await browser.newContext();
  const g = await guest.newPage();
  await g.goto(BASE + "/admin/urunler");
  ok("guest redirected to login", g.url().includes("/giris"), g.url());

  // admin login
  await admin.goto(BASE + "/giris?next=/admin");
  await admin.fill("#email", "admin@example.com");
  await admin.fill("#password", "degistir-beni-123");
  await admin.click("button:has-text('Giriş yap')");
  await admin.waitForURL(BASE + "/admin");
  ok("admin dashboard", (await admin.textContent("h1")) === "Özet");
  ok("dashboard shows go-live warnings", (await admin.textContent("main")).includes("Demo ödeme açık"));

  // forged admin action from a customer session
  await admin.goto(BASE + "/admin/kategoriler");
  const actionField = await admin.$eval("section:has(h2:has-text('Yeni kategori')) form input[name^='$ACTION_ID_']", (i) => i.name);
  const cust = await browser.newContext();
  const cp = await cust.newPage();
  await cp.goto(BASE + "/uye-ol");
  await cp.fill("#name", "Kötü Niyetli");
  await cp.fill("#email", "kotu@example.com");
  await cp.fill("#password", "Kotu-Niyet-2026");
  await cp.fill("#password2", "Kotu-Niyet-2026");
  await cp.check("input[name=terms]");
  await cp.click("button:has-text('Üye ol')");
  await cp.waitForURL(/hesabim/);
  const forged = await cust.request.post(BASE + "/admin/kategoriler", {
    headers: { Origin: BASE },
    multipart: { [actionField]: "", name: "Hacked Kategori", slug: "hacked", parentId: "", sortOrder: "0", isActive: "on", description: "" },
    maxRedirects: 0,
  });
  await admin.goto(BASE + "/admin/kategoriler");
  ok("forged admin action by customer has no effect", !(await admin.content()).includes("Hacked Kategori"), `status ${forged.status()}`);

  // create category (subcategory of Kolye)
  const newForm = admin.locator("section:has(h2:has-text('Yeni kategori')) form");
  await newForm.locator("input[name=name]").fill("Test Alt Kategori");
  await newForm.locator("select[name=parentId]").selectOption({ label: "Kolye" });
  await newForm.locator("button:has-text('Ekle')").click();
  await admin.waitForSelector("text=Kategori kaydedildi");
  ok("category created", true);

  // create product
  await admin.goto(BASE + "/admin/urunler/yeni");
  await admin.fill("input[name=name]", "Test Kolye Yönetim");
  await admin.selectOption("select[name=categoryId]", { label: "Test Alt Kategori" });
  await admin.fill("input[name=price]", "199,90");
  await admin.fill("input[name=compareAtPrice]", "100");
  await admin.fill("input[name=stock]", "5");
  await admin.fill("textarea[name=description]", "Yönetim panelinden eklenen test ürünü.");
  await admin.click("button:has-text('Ürünü oluştur')");
  await admin.waitForSelector("text=Eski fiyat, satış fiyatından yüksek olmalı");
  ok("invalid old price rejected", true);
  await admin.fill("input[name=name]", "Test Kolye Yönetim");
  await admin.selectOption("select[name=categoryId]", { label: "Test Alt Kategori" });
  await admin.fill("input[name=price]", "199,90");
  await admin.fill("input[name=compareAtPrice]", "249,90");
  await admin.fill("input[name=stock]", "5");
  await admin.fill("textarea[name=description]", "Yönetim panelinden eklenen test ürünü.");
  await admin.click("button:has-text('Ürünü oluştur')");
  await admin.waitForSelector("text=Ürün oluşturuldu");
  const productUrl = admin.url().split("?")[0];
  ok("product created", true);

  // image upload: real PNG accepted, disguised SVG rejected
  await admin.setInputFiles("input[name=file]", path.join(__dirname, "fake.png"));
  await admin.click("button:has-text('Yükle')");
  await admin.waitForSelector("text=Yalnızca JPG, PNG veya WebP");
  ok("disguised SVG upload rejected", true);
  await admin.setInputFiles("input[name=file]", path.join(__dirname, "test.png"));
  await admin.fill("form:has(input[name=file]) input[name=alt]", "Test görsel");
  await admin.click("button:has-text('Yükle')");
  await admin.waitForSelector("text=Görsel yüklendi");
  const imgSrc = await admin.getAttribute("form:has(input[name=sortOrder]) img", "src");
  const imgRes = await admin.request.get(BASE + imgSrc);
  ok("uploaded image served as PNG", imgRes.status() === 200 && imgRes.headers()["content-type"] === "image/png", imgSrc);
  ok("path traversal blocked", (await admin.request.get(BASE + "/media/..%2F..%2Fdev.db")).status() === 404);

  // variant
  const vForm = admin.locator("form:has(input[placeholder='Altın / 45 cm'])");
  await vForm.locator("input[name=name]").fill("45 cm");
  await vForm.locator("input[name=priceDelta]").fill("10");
  await vForm.locator("input[name=stock]").fill("3");
  await vForm.locator("button:has-text('Ekle')").click();
  await admin.waitForSelector("text=Seçenek kaydedildi");
  ok("variant added", true);

  // storefront shows it with discount
  await admin.goto(BASE + "/kategori/kolye?q=yonetim");
  const cardText = await admin.textContent("main article");
  ok("product visible in parent category + search", cardText.includes("Test Kolye Yönetim") && cardText.includes("%20"), cardText.slice(0, 80));

  // coupon + bank settings
  await admin.goto(BASE + "/admin/kampanyalar");
  const cForm = admin.locator("form:has(span:has-text('Yeni kod'))");
  await cForm.locator("input[name=code]").fill("yaz25");
  await cForm.locator("select[name=type]").selectOption("PERCENT");
  await cForm.locator("input[name=value]").fill("150");
  await cForm.locator("button:has-text('Ekle')").click();
  await admin.waitForSelector("text=İndirim değeri geçersiz");
  ok("coupon >100% rejected", true);
  await cForm.locator("input[name=code]").fill("yaz25");
  await cForm.locator("input[name=value]").fill("25");
  await cForm.locator("button:has-text('Ekle')").click();
  await admin.waitForSelector("text=İndirim kodu kaydedildi");
  ok("coupon created (uppercased)", (await admin.content()).includes("YAZ25"));

  await admin.goto(BASE + "/admin/vitrin");
  await admin.fill("input[name=bankIban]", "TR12 3456");
  await admin.click("button:has-text('Ayarları kaydet')");
  await admin.waitForSelector("text=IBAN TR ile başlamalı");
  ok("bad IBAN rejected", true);
  await admin.fill("input[name=bankIban]", "TR00 0000 0000 0000 0000 0000 00");
  await admin.fill("input[name=bankName]", "Örnek Banka (test)");
  await admin.fill("input[name=announcement]", "Test duyurusu A | Test duyurusu B");
  await admin.click("button:has-text('Ayarları kaydet')");
  await admin.waitForSelector("text=Ayarlar kaydedildi");
  await admin.goto(BASE + "/");
  ok("announcement updated on storefront", (await admin.textContent("body")).includes("Test duyurusu A"));

  // customer orders the new product by bank transfer
  await cp.goto(BASE + "/urun/test-kolye-yonetim");
  await cp.click("label:has-text('45 cm')");
  await cp.locator("form#buy-form").getByRole("button", { name: "Sepete ekle" }).first().click();
  await cp.waitForSelector("text=Sepete eklendi");
  await cp.goto(BASE + "/odeme");
  ok("bank transfer offered once IBAN set", await cp.isVisible("text=Havale / EFT"));
  await cp.fill("#phone", "05551234567");
  await cp.fill("#city", "Ankara");
  await cp.fill("#district", "Çankaya");
  await cp.fill("#line", "Deneme Cad. No:10 Daire:3");
  await cp.click("label:has-text('Havale / EFT')");
  await cp.check("input[name=agreements]");
  await cp.click("button:has-text('Siparişi onayla')");
  await cp.waitForURL(/siparis\//, { timeout: 8000 }).catch(async () => { console.log("ALERT:", await cp.locator("[role=alert]").allTextContents()); await cp.screenshot({ path: "co.png", fullPage: true }); throw new Error("checkout stuck"); });
  ok("bank transfer order shows IBAN", (await cp.textContent("main")).includes("TR000000000000000000000000"));
  ok("guest-less member order listed", (await (await cp.goto(BASE + "/hesabim/siparisler")).text()).includes("Ödeme bekleniyor"));

  // admin sees order, variant stock decreased, cancel restores it
  await admin.goto(BASE + "/admin/siparisler?test=gizle");
  await admin.click("table a >> nth=0");
  await admin.waitForSelector("text=Durum");
  const orderAdminUrl = admin.url();
  await admin.goto(productUrl);
  ok("variant stock reserved (3→2)", (await admin.inputValue("form:has(input[value='45 cm']) input[name=stock]")) === "2");
  await admin.goto(orderAdminUrl);
  await admin.selectOption("select[name=status]", "CANCELLED");
  await admin.fill("input[name=note]", "Test iptal");
  await admin.click("button:has-text('Güncelle')");
  await admin.waitForSelector("text=Sipariş durumu güncellendi");
  await admin.goto(productUrl);
  ok("cancel restores stock (2→3)", (await admin.inputValue("form:has(input[value='45 cm']) input[name=stock]")) === "3");
  await admin.goto(orderAdminUrl);
  await admin.selectOption("select[name=status]", "PAID");
  await admin.click("button:has-text('Güncelle')");
  await admin.waitForSelector("text=yeniden açılamaz");
  ok("cancelled order cannot be reopened", true);

  // customers: deactivate the customer → their session ends
  await admin.goto(BASE + "/admin/musteriler?q=kotu");
  await admin.click("table a:has-text('Kötü Niyetli')");
  await admin.click("button:has-text('Hesabı pasif yap')");
  await admin.waitForSelector("text=Hesap pasif yapıldı");
  await cp.goto(BASE + "/hesabim");
  ok("deactivated user logged out", cp.url().includes("/giris"));

  // delete product requires confirmation
  await admin.goto(productUrl);
  await admin.click("button:has-text('Kalıcı olarak sil')");
  await admin.waitForSelector("text=Silmek için kutuya SIL yazın");
  await admin.fill("input[name=confirm]", "SIL");
  await admin.click("button:has-text('Kalıcı olarak sil')");
  await admin.waitForSelector("text=Ürün silindi");
  ok("product deleted after confirmation", (await admin.request.get(BASE + "/urun/test-kolye-yonetim")).status() === 404);

  // CSV export works for admin
  const csv = await admin.request.get(BASE + "/admin/bulten");
  ok("admin CSV export", csv.status() === 200 && (await csv.text()).startsWith("email,created_at"));

  ok("no page errors", errors.length === 0, errors.join(" | "));
  await browser.close();
  for (const r of results) console.log(r.join("  "));
  console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} passed`);
})().catch((e) => { for (const r of results) console.log(r.join("  ")); console.error("CRASH:", e.message.split("\n")[0]); process.exit(1); });
