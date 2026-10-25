// Seeds DEMO data for development. Products, prices and stock are examples only (isDemo = true).
// Run: npm run db:seed   (safe to run again: it wipes catalog/demo content first, keeps users)
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildSearchText, slugify } from "../src/lib/text";

try {
  process.loadEnvFile(".env");
} catch {}

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });

const categories: { name: string; slug: string; description: string; children: [string, string][] }[] = [
  { name: "Bileklik", slug: "bileklik", description: "Çelik, zincir ve charm bileklikler.", children: [["Çelik Bileklik", "celik-bileklik"], ["Zincir Bileklik", "zincir-bileklik"], ["Charm Bileklik", "charm-bileklik"], ["Kelepçe", "kelepce"]] },
  { name: "Kolye", slug: "kolye", description: "Zincir, taşlı ve katmanlı kolyeler.", children: [["Zincir Kolye", "zincir-kolye"], ["Taşlı Kolye", "tasli-kolye"], ["Katmanlı Kolye", "katmanli-kolye"], ["İnci Kolye", "inci-kolye"]] },
  { name: "Küpe", slug: "kupe", description: "Halka, sallantılı ve inci küpeler.", children: [["Halka Küpe", "halka-kupe"], ["Sallantılı Küpe", "sallantili-kupe"], ["İnci Küpe", "inci-kupe"], ["Kıkırdak Küpe", "kikirdak-kupe"]] },
  { name: "Yüzük", slug: "yuzuk", description: "Taşlı, burgu ve ayarlanabilir yüzükler.", children: [["Taşlı Yüzük", "tasli-yuzuk"], ["Burgu Yüzük", "burgu-yuzuk"], ["Ayarlanabilir Yüzük", "ayarlanabilir-yuzuk"]] },
  { name: "Saat", slug: "saat", description: "Günlük kullanım için kadın saatleri.", children: [["Çelik Kordon", "celik-kordon-saat"], ["Deri Kordon", "deri-kordon-saat"]] },
  { name: "Halhal", slug: "halhal", description: "Yaz akşamları için ince halhallar.", children: [["Zincir Halhal", "zincir-halhal"], ["Charm Halhal", "charm-halhal"]] },
  { name: "Kişiye Özel", slug: "kisiye-ozel", description: "Harf, isim ve tarih ile kişiselleştirilen takılar.", children: [["Harf Kolye", "harf-kolye"], ["İsim Kolye", "isim-kolye"], ["Kişiye Özel Bileklik", "kisiye-ozel-bileklik"]] },
  { name: "Setler", slug: "setler", description: "Birlikte takılmak üzere seçilmiş kombinler.", children: [] },
];

type V = [name: string, stock: number, delta?: number];
type P = {
  name: string;
  cat: string;
  shape: string;
  metal: "altin" | "rose" | "gumus" | "celik";
  tone: "blush" | "sage" | "mist" | "sand";
  price: number; // TL
  was?: number; // TL
  stock?: number;
  variants?: V[];
  pers?: ["LETTER" | "TEXT", string, number];
  featured?: boolean;
  days: number; // created this many days ago
  desc: string;
};

const MAT = "Çelik üzeri kaplama (demo bilgi — gerçek malzeme bilgisiyle değiştirin)";

const products: P[] = [
  { name: "İnce Zincir Bileklik", cat: "zincir-bileklik", shape: "bracelet", metal: "altin", tone: "sand", price: 349.9, stock: 24, days: 3, featured: true, desc: "Tek başına sade, diğer bilekliklerle katman olarak da şık duran ince zincir." },
  { name: "Burgu Zincir Bileklik", cat: "zincir-bileklik", shape: "bracelet", metal: "rose", tone: "blush", price: 389.9, was: 449.9, stock: 12, days: 20, desc: "Işığı yakalayan burgu örgülü zincir bileklik." },
  { name: "Minimal Çelik Bileklik", cat: "celik-bileklik", shape: "bracelet", metal: "celik", tone: "mist", price: 299.9, stock: 30, days: 40, desc: "Günlük kullanım için sade çelik bileklik." },
  { name: "Gümüş Renk Zincir Bileklik", cat: "celik-bileklik", shape: "bracelet", metal: "gumus", tone: "mist", price: 319.9, stock: 0, days: 60, desc: "Soğuk tonlu kombinler için gümüş renk zincir." },
  { name: "Kalp Charm Bileklik", cat: "charm-bileklik", shape: "anklet", metal: "altin", tone: "blush", price: 429.9, was: 499.9, stock: 9, days: 5, featured: true, desc: "Küçük kalp charm'ları olan ince bileklik." },
  { name: "Yıldız Charm Bileklik", cat: "charm-bileklik", shape: "anklet", metal: "gumus", tone: "sage", price: 409.9, stock: 14, days: 12, desc: "Yıldız charm'lı, ayarlanabilir uzunlukta bileklik." },
  { name: "Burgu Kelepçe", cat: "kelepce", shape: "twist", metal: "altin", tone: "sand", price: 469.9, stock: 7, days: 30, desc: "Açık uçlu, bileğe göre hafifçe şekil verilebilen kelepçe." },
  { name: "Sade Kelepçe", cat: "kelepce", shape: "ring", metal: "rose", tone: "blush", price: 439.9, was: 529.9, stock: 3, days: 75, desc: "Tek parça, parlak yüzeyli kelepçe." },

  { name: "Katmanlı Kolye Seti", cat: "katmanli-kolye", shape: "layers", metal: "altin", tone: "sage", price: 649.9, stock: 10, days: 2, featured: true, desc: "Üç farklı uzunlukta zincir, tek kombin.", variants: [["Altın renk", 6], ["Rose renk", 4, 2000]] },
  { name: "Damla Taşlı Kolye", cat: "tasli-kolye", shape: "drop", metal: "altin", tone: "mist", price: 529.9, stock: 11, days: 9, desc: "Pembe tonlu damla taş uçlu kolye." },
  { name: "Damla Taşlı Kolye Gümüş", cat: "tasli-kolye", shape: "drop", metal: "gumus", tone: "sage", price: 529.9, was: 589.9, stock: 6, days: 45, desc: "Gümüş renk zincir üzerinde damla taş." },
  { name: "İnce Zincir Kolye", cat: "zincir-kolye", shape: "layers", metal: "rose", tone: "blush", price: 379.9, stock: 0, days: 15, desc: "Uçsuz, tek başına takılan ince zincir.", variants: [["40 cm", 0], ["45 cm", 0]] },
  { name: "Tek İnci Kolye", cat: "inci-kolye", shape: "pearl", metal: "altin", tone: "sand", price: 459.9, stock: 13, days: 25, desc: "İnce zincirde tek inci (inci türü demo bilgidir)." },

  { name: "İnce Halka Küpe", cat: "halka-kupe", shape: "hoops", metal: "altin", tone: "blush", price: 279.9, stock: 40, days: 1, featured: true, desc: "Her gün takılabilecek hafif halka küpe.", variants: [["Küçük (12 mm)", 20], ["Orta (20 mm)", 15, 3000], ["Büyük (30 mm)", 5, 6000]] },
  { name: "Halka Küpe Gümüş", cat: "halka-kupe", shape: "hoops", metal: "gumus", tone: "mist", price: 279.9, was: 329.9, stock: 18, days: 33, desc: "Gümüş renk, orta boy halka küpe." },
  { name: "Damla Sallantılı Küpe", cat: "sallantili-kupe", shape: "drop", metal: "rose", tone: "blush", price: 349.9, stock: 8, days: 6, desc: "Hareketle hafifçe sallanan damla uçlu küpe." },
  { name: "İnci Küpe", cat: "inci-kupe", shape: "pearl", metal: "altin", tone: "mist", price: 299.9, stock: 22, days: 18, featured: true, desc: "Sade bir inci, her yakayla uyumlu." },
  { name: "Kıkırdak Halka", cat: "kikirdak-kupe", shape: "hoops", metal: "celik", tone: "sage", price: 199.9, stock: 2, days: 50, desc: "Kıkırdak için küçük çaplı halka (tek adet)." },

  { name: "Taşlı Yüzük", cat: "tasli-yuzuk", shape: "ring", metal: "altin", tone: "blush", price: 329.9, stock: 0, days: 4, desc: "Tek taşlı ince yüzük.", variants: [["14 numara", 4], ["16 numara", 6], ["18 numara", 0]] },
  { name: "Burgu Yüzük", cat: "burgu-yuzuk", shape: "twist", metal: "altin", tone: "sand", price: 289.9, was: 349.9, stock: 0, days: 22, desc: "Burgu desenli, kombinlenebilir yüzük.", variants: [["14 numara", 3], ["16 numara", 5], ["18 numara", 2]] },
  { name: "Burgu Yüzük Rose", cat: "burgu-yuzuk", shape: "twist", metal: "rose", tone: "blush", price: 289.9, stock: 0, days: 70, desc: "Rose renk burgu yüzük.", variants: [["14 numara", 1], ["16 numara", 2]] },
  { name: "Ayarlanabilir Taşlı Yüzük", cat: "ayarlanabilir-yuzuk", shape: "ring", metal: "gumus", tone: "mist", price: 259.9, stock: 16, days: 11, desc: "Açık uçlu, parmağa göre ayarlanabilir yüzük." },

  { name: "Çelik Kordon Kadın Saati", cat: "celik-kordon-saat", shape: "watch", metal: "altin", tone: "sand", price: 1249.9, was: 1449.9, stock: 5, days: 8, featured: true, desc: "İnce kasa, çelik kordonlu kadın saati (mekanizma bilgisi demo)." },
  { name: "Gümüş Renk Kadın Saati", cat: "celik-kordon-saat", shape: "watch", metal: "gumus", tone: "mist", price: 1199.9, stock: 4, days: 28, desc: "Gümüş renk kasa ve kordon." },
  { name: "Deri Kordon Saat", cat: "deri-kordon-saat", shape: "watch", metal: "rose", tone: "blush", price: 1099.9, stock: 0, days: 55, desc: "Rose kasa, deri görünümlü kordon." },

  { name: "Kalpli Halhal", cat: "charm-halhal", shape: "anklet", metal: "altin", tone: "blush", price: 319.9, stock: 15, days: 7, featured: true, desc: "Küçük kalp uçlu ince halhal." },
  { name: "İnce Zincir Halhal", cat: "zincir-halhal", shape: "anklet", metal: "gumus", tone: "sage", price: 269.9, was: 319.9, stock: 10, days: 35, desc: "Sade ve hafif zincir halhal." },

  { name: "Harf Kolye", cat: "harf-kolye", shape: "letter", metal: "altin", tone: "sand", price: 449.9, stock: 0, days: 0, featured: true, desc: "Baş harfinle kişiselleştirilen madalyon uçlu kolye.", pers: ["LETTER", "Harf", 1], variants: [["Altın renk / 40 cm", 10], ["Altın renk / 45 cm", 12], ["Rose renk / 45 cm", 6], ["Gümüş renk / 45 cm", 8]] },
  { name: "İsim Kolye", cat: "isim-kolye", shape: "name", metal: "altin", tone: "blush", price: 549.9, stock: 0, days: 10, featured: true, desc: "İstediğin ismin el yazısı formunda kesildiği kolye.", pers: ["TEXT", "Yazılacak isim", 10], variants: [["Altın renk", 15], ["Gümüş renk", 9]] },
  { name: "İsim Kolye Rose", cat: "isim-kolye", shape: "name", metal: "rose", tone: "mist", price: 549.9, was: 599.9, stock: 8, days: 42, desc: "Rose renk isim kolye.", pers: ["TEXT", "Yazılacak isim", 10] },
  { name: "Harfli Bileklik", cat: "kisiye-ozel-bileklik", shape: "letter", metal: "gumus", tone: "sage", price: 399.9, stock: 14, days: 14, desc: "İnce zincir üzerinde harf madalyonu.", pers: ["LETTER", "Harf", 1] },

  { name: "Katman Kombin Seti", cat: "setler", shape: "layers", metal: "altin", tone: "blush", price: 899.9, was: 1099.9, stock: 6, days: 16, desc: "Kolye ve bileklikten oluşan uyumlu set (set içeriği demo)." },
  { name: "İnci Set", cat: "setler", shape: "pearl", metal: "gumus", tone: "mist", price: 749.9, stock: 4, days: 65, desc: "İnci küpe ve inci kolye bir arada." },
];

const tones = ["blush", "sage", "mist", "sand"] as const;
const kurus = (tl: number) => Math.round(tl * 100);

async function main() {
  // Clear catalog & demo content (users, orders kept unless --all)
  const all = process.argv.includes("--all");
  if (all) {
    await prisma.order.deleteMany();
  }
  await prisma.cartItem.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.coupon.deleteMany();

  const catId: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const parent = await prisma.category.create({ data: { name: c.name, slug: c.slug, description: c.description, sortOrder: i } });
    catId[c.slug] = parent.id;
    for (const [j, [name, slug]] of c.children.entries()) {
      const child = await prisma.category.create({ data: { name, slug, parentId: parent.id, sortOrder: j } });
      catId[slug] = child.id;
    }
  }

  const productId: Record<string, string> = {};
  for (const p of products) {
    const slug = slugify(p.name);
    const second = tones[(tones.indexOf(p.tone) + 1) % tones.length];
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.desc,
        details: [`Malzeme: ${MAT}`, "Renk: " + { altin: "Altın", rose: "Rose", gumus: "Gümüş", celik: "Çelik" }[p.metal], "Bu ürün demo kataloğa aittir."].join("\n"),
        categoryId: catId[p.cat],
        price: kurus(p.price),
        compareAtPrice: p.was ? kurus(p.was) : null,
        stock: p.stock ?? 0,
        sku: `DEMO-${slug.slice(0, 12).toUpperCase()}`,
        metal: p.metal,
        material: MAT,
        isFeatured: !!p.featured,
        isDemo: true,
        personalization: p.pers?.[0] ?? "NONE",
        personalizationLabel: p.pers?.[1] ?? null,
        personalizationMax: p.pers?.[2] ?? 0,
        searchText: buildSearchText([p.name, p.desc, p.cat]),
        createdAt: new Date(Date.now() - p.days * 864e5),
        images: {
          create: [
            { url: `/demo/${p.shape}-${p.metal}-${p.tone}.svg`, alt: `${p.name} (temsilî çizim)`, sortOrder: 0 },
            { url: `/demo/${p.shape}-${p.metal}-${second}.svg`, alt: `${p.name}, ikinci görünüm (temsilî çizim)`, sortOrder: 1 },
          ],
        },
        variants: p.variants
          ? { create: p.variants.map(([name, stock, delta], i) => ({ name, stock, priceDelta: delta ?? 0, sortOrder: i })) }
          : undefined,
      },
    });
    productId[slug] = created.id;
  }

  const coll = async (name: string, tone: string, description: string, slugs: string[], sortOrder: number) =>
    prisma.collection.create({
      data: {
        name,
        slug: slugify(name),
        tone,
        description,
        sortOrder,
        products: { create: slugs.filter((s) => productId[s]).map((s, i) => ({ productId: productId[s], sortOrder: i })) },
      },
    });
  await coll("Harfini Seç", "sand", "Baş harfin, ismin, sana ait olan.", ["harf-kolye", "isim-kolye", "harfli-bileklik", "isim-kolye-rose"], 0);
  await coll("Katman Katman", "sage", "Üst üste takıldıkça güzelleşen parçalar.", ["katmanli-kolye-seti", "ince-zincir-kolye", "ince-zincir-bileklik", "katman-kombin-seti"], 1);
  await coll("Yaz Akşamı", "blush", "Halhal, inci ve hafif küpeler.", ["kalpli-halhal", "ince-zincir-halhal", "inci-kupe", "ince-halka-kupe"], 2);

  await prisma.banner.createMany({
    data: [
      { placement: "HERO", eyebrow: "Yeni koleksiyon", title: "Bu tam senlik.", subtitle: "Harfini, rengini, zincir boyunu seç. Kişiye özel takılar.", ctaLabel: "Harf kolyeleri gör", ctaHref: "/kategori/harf-kolye", imageUrl: "/demo/letter-altin-sand.svg", tone: "sand", sortOrder: 0 },
      { placement: "HERO", eyebrow: "Katman katman", title: "Kombinini kendin kur", subtitle: "Farklı boylarda zincirler.", ctaLabel: "Kolyeler", ctaHref: "/kategori/kolye", imageUrl: "/demo/layers-altin-sage.svg", tone: "sage", sortOrder: 1 },
      { placement: "HERO", eyebrow: "İndirimde", title: "Seçili ürünlerde indirim", subtitle: "Demo kampanya alanı.", ctaLabel: "Kampanyalar", ctaHref: "/urunler?indirim=1", imageUrl: "/demo/hoops-rose-blush.svg", tone: "blush", sortOrder: 2 },
      { placement: "PROMO", eyebrow: "Demo kupon", title: "HOSGELDIN10 ile ilk siparişe %10", subtitle: "Örnek kampanya; yönetim panelinden değiştirilebilir.", ctaLabel: "Alışverişe başla", ctaHref: "/urunler", tone: "mist", sortOrder: 0 },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      { code: "HOSGELDIN10", type: "PERCENT", value: 10, minSubtotal: 0 },
      { code: "SEPET100", type: "FIXED", value: 10000, minSubtotal: 75000 },
    ],
  });

  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (email && password.length >= 10) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, name: "Yönetici", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`Admin created: ${email}`);
    }
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (min 10 chars) not set: no admin created.");
  }
  console.log(`Seeded ${products.length} demo products in ${Object.keys(catId).length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
