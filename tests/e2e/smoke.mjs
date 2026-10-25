/**
 * Test de bout en bout dans un vrai navigateur (Chromium via Playwright).
 * Usage : BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:e2e
 * Nécessite les produits de démonstration (npm run db:demo).
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "test-results";
mkdirSync(SHOTS, { recursive: true });
const errors = [];
let step = 0;
const ok = (msg) => console.log(`  ✓ ${++step}. ${msg}`);
const fail = (msg) => { throw new Error(msg); };

async function noBrokenImages(page, label) {
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(500);
  const broken = await page.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => i.getAttribute("src")));
  if (broken.length) fail(`${label} : images cassées ${broken.join(", ")}`);
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem("mlt_consent_v1", JSON.stringify({ necessary: true, analytics: false, date: "e2e" })));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("favicon") && errors.push(m.text()));

  console.log("Boutique (mobile)");
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (!(await page.getByRole("link", { name: /Découvrir les maillots/ }).first().isVisible())) fail("Bouton « Découvrir les maillots » absent");
  await noBrokenImages(page, "Accueil");
  ok("Accueil affiché, aucune image cassée");

  await page.goto(`${BASE}/boutique?taille=M&dispo=1`, { waitUntil: "networkidle" });
  const count = await page.locator("main ul li a[href^='/maillot/']").count();
  if (count === 0) fail("Filtre taille M + en stock : aucun résultat");
  ok(`Catalogue filtré (taille M, en stock) : ${count} maillots`);

  const sugg = await (await page.request.get(`${BASE}/api/search/suggest?q=real`)).json();
  if (!sugg.products.length) fail("Recherche « real » sans résultat");
  ok("Suggestions de recherche");

  await page.goto(`${BASE}/maillot/real-madrid-domicile-2025-26`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Dos", exact: true }).click();
  if ((await page.getByRole("button", { name: "Dos", exact: true }).getAttribute("aria-pressed")) !== "true") fail("Bouton DOS inactif");
  await page.getByRole("button", { name: "Devant", exact: true }).click();
  ok("Boutons DEVANT / DOS");
  const sold = page.getByRole("radio", { name: "3XL", exact: true });
  if (!(await sold.isDisabled())) fail("La taille épuisée (3XL) devrait être désactivée");
  ok("Taille épuisée désactivée");
  await page.getByRole("radio", { name: "M", exact: true }).click();
  await page.getByRole("radio", { name: /Avec flocage/ }).click();
  await page.getByLabel("Nom").fill("legende");
  await page.getByLabel("Numéro").fill("7");
  await page.waitForTimeout(400);
  if (!(await page.getByText("LEGENDE").first().isVisible())) fail("Aperçu du flocage absent");
  await page.screenshot({ path: `${SHOTS}/fiche-flocage.png` });
  ok("Aperçu du flocage sur le dos");
  await page.locator(".fixed.inset-x-0.bottom-0 button").click();
  await page.getByRole("dialog", { name: "Panier" }).getByText("LEGENDE · 7").waitFor();
  ok("Ajout au panier avec flocage");

  await page.goto(`${BASE}/panier`, { waitUntil: "networkidle" });
  await page.getByLabel("Code promo").fill("DEMO10");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await page.getByText(/Code DEMO10 appliqué/).waitFor();
  ok("Code promo appliqué (recalcul serveur)");

  await page.goto(`${BASE}/commande`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail", { exact: true }).fill("client-e2e@example.com");
  await page.getByLabel("Prénom", { exact: true }).fill("Client");
  await page.getByLabel("Nom", { exact: true }).fill("Test");
  await page.getByLabel("Adresse", { exact: true }).fill("10 rue du Stade");
  await page.getByLabel("Code postal").fill("75015");
  await page.getByLabel("Ville").fill("Paris");
  await page.getByRole("checkbox", { name: /conditions générales/ }).check();
  const payBtn = page.getByRole("button", { name: /Payer/ });
  if (process.env.STRIPE_CONFIGURED === "1") {
    await payBtn.click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });
    ok("Redirection vers la page de paiement Stripe");
  } else {
    if (!(await payBtn.isDisabled())) fail("Sans Stripe, le bouton Payer doit être désactivé");
    const res = await page.request.post(`${BASE}/api/checkout`, { data: { lines: [], checkoutToken: crypto.randomUUID(), email: "a@b.fr", firstName: "a", lastName: "b", line1: "abc", postalCode: "75000", city: "P", country: "FR", shippingMethodId: "x", acceptTerms: true } });
    if (res.status() !== 503) fail(`Sans Stripe, l'API doit répondre 503 (reçu ${res.status()})`);
    ok("Sans clé Stripe : paiement clairement désactivé, aucune commande créée");
  }

  console.log("Compte client");
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto(`${BASE}/compte/inscription`);
  await page.getByLabel("Prénom et nom").fill("Client E2E");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel(/Mot de passe \(8/).fill("motdepasse-e2e");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.waitForURL(`${BASE}/compte`);
  ok("Création de compte et connexion");
  await page.goto(`${BASE}/maillot/psg-domicile-2025-26`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Ajouter aux favoris" }).last().click();
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/compte/favoris`);
  if (!(await page.getByText("Paris Domicile 2025/26").isVisible())) fail("Favori non enregistré");
  ok("Favoris");
  const blocked = await page.goto(`${BASE}/admin`);
  if (!page.url().includes("/compte/connexion")) fail(`Un client a accès à /admin (${blocked?.status()})`);
  ok("Administration inaccessible à un client");

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log("Administration (ordinateur)");
    const admin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const a = await admin.newPage();
    a.on("pageerror", (e) => errors.push(e.message));
    await a.goto(`${BASE}/compte/connexion?next=/admin`);
    await a.getByLabel("E-mail", { exact: true }).fill(process.env.ADMIN_EMAIL);
    await a.getByLabel("Mot de passe", { exact: true }).fill(process.env.ADMIN_PASSWORD);
    await a.getByRole("button", { name: "Se connecter" }).click();
    await a.waitForURL(`${BASE}/admin`);
    await a.screenshot({ path: `${SHOTS}/admin-dashboard.png`, fullPage: true });
    ok("Connexion admin et tableau de bord");

    // fabrique deux vraies photos PNG (devant / dos) pour tester l'import
    const shot = async (color, label) => {
      const p = await admin.newPage({ viewport: { width: 800, height: 1000 } });
      await p.setContent(`<body style="margin:0;background:${color};display:flex;align-items:center;justify-content:center;height:100vh;font:bold 120px sans-serif;color:#fff">${label}</body>`);
      const buf = await p.screenshot({ type: "png" });
      await p.close();
      return { name: `${label}.png`, mimeType: "image/png", buffer: buf };
    };
    const name = `Maillot Test E2E ${Date.now()}`;
    await a.goto(`${BASE}/admin/produits/nouveau`);
    await a.locator("input[name=name]").fill(name);
    await a.locator("input[name=club]").fill("Club Test");
    await a.locator("input[name=season]").fill("2025/26");
    await a.locator("input[name=price]").fill("79,90");
    await a.locator("input[name=frontImage]").setInputFiles(await shot("#183153", "DEVANT"));
    await a.locator("input[name=backImage]").setInputFiles(await shot("#7a1c1c", "DOS"));
    await a.locator("input[aria-label='Stock M']").fill("4");
    await a.getByRole("button", { name: "Créer le produit" }).click();
    await a.waitForURL(/\/admin\/produits\/.+\?cree=1/, { timeout: 30000 });
    ok("Création d'un maillot avec photos devant et dos importées");
    const slug = await a.locator("input[name=slug]").inputValue();
    const shop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await shop.goto(`${BASE}/maillot/${slug}`, { waitUntil: "networkidle" });
    await noBrokenImages(shop, "Nouveau produit");
    if (!(await shop.getByRole("radio", { name: "S", exact: true }).isDisabled())) fail("Taille S (stock 0) devrait être épuisée");
    if (await shop.getByRole("radio", { name: "M", exact: true }).isDisabled()) fail("Taille M (stock 4) devrait être disponible");
    await shop.getByRole("button", { name: "Dos", exact: true }).click();
    await shop.mouse.move(1300, 850);
    await shop.evaluate(() => window.scrollTo(0, 0));
    await shop.waitForTimeout(800);
    await shop.screenshot({ path: `${SHOTS}/nouveau-produit-dos.png` });
    ok("Le maillot créé est en ligne avec ses vraies photos et son stock par taille");
    await shop.close();
    await admin.close();
  } else {
    console.log("  (administration non testée : définir ADMIN_EMAIL et ADMIN_PASSWORD)");
  }

  if (errors.length) fail(`Erreurs JavaScript dans le navigateur :\n${errors.join("\n")}`);
  console.log(`\nTous les tests de bout en bout sont passés (${step} vérifications).`);
} catch (e) {
  console.error(`\n✗ ÉCHEC : ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
