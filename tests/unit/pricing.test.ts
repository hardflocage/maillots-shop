import { describe, expect, it } from "vitest";
import { computeTotals, sanitizeFlockingName, validFlockingNumber, bestAutoDiscount } from "@/lib/pricing";
import { parsePrice, formatPrice, slugify } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";

const jersey = (q = 1, flock = 0) => ({ unitPrice: 8990, customizationPrice: flock, quantity: q });

describe("computeTotals", () => {
  it("additionne maillots et flocage", () => {
    const t = computeTotals({ lines: [jersey(1, 1500), jersey(2)] });
    expect(t.subtotal).toBe(8990 + 1500 + 2 * 8990);
    expect(t.itemCount).toBe(3);
    expect(t.total).toBe(t.subtotal);
  });

  it("applique les frais de port puis la gratuité au-dessus du seuil", () => {
    const shipping = { price: 490, freeOver: 10000 };
    const under = computeTotals({ lines: [jersey()], shipping });
    expect(under.shipping).toBe(490);
    expect(under.freeShippingRemaining).toBe(10000 - 8990);
    expect(under.total).toBe(8990 + 490);
    const over = computeTotals({ lines: [jersey(2)], shipping });
    expect(over.shipping).toBe(0);
    expect(over.total).toBe(17980);
  });

  it("le seuil de livraison offerte se calcule après remises", () => {
    const t = computeTotals({ lines: [jersey(1, 1500)], promo: { code: "X", type: "FIXED", value: 1000, minSubtotal: null }, shipping: { price: 490, freeOver: 10000 } });
    expect(t.subtotal).toBe(10490);
    expect(t.shipping).toBe(490); // 10490 - 1000 = 9490 < 10000
  });

  it("choisit la meilleure remise automatique multi-maillots", () => {
    const rules = [{ name: "2 maillots", minQuantity: 2, percentOff: 10 }, { name: "3 maillots", minQuantity: 3, percentOff: 15 }];
    expect(bestAutoDiscount(1, rules)).toBeNull();
    expect(bestAutoDiscount(2, rules)?.percentOff).toBe(10);
    expect(bestAutoDiscount(5, rules)?.percentOff).toBe(15);
    const t = computeTotals({ lines: [jersey(3)], autoDiscounts: rules });
    expect(t.autoDiscount).toBe(Math.round(26970 * 0.15));
  });

  it("cumule remise auto puis code promo en pourcentage sur le reste", () => {
    const t = computeTotals({ lines: [jersey(2)], autoDiscounts: [{ name: "2", minQuantity: 2, percentOff: 10 }], promo: { code: "P", type: "PERCENT", value: 10, minSubtotal: null } });
    expect(t.autoDiscount).toBe(1798);
    expect(t.promoDiscount).toBe(Math.round((17980 - 1798) * 0.1));
    expect(t.total).toBe(17980 - 1798 - 1618);
  });

  it("refuse un code sous le minimum d'achat", () => {
    const t = computeTotals({ lines: [jersey()], promo: { code: "BIG", type: "PERCENT", value: 20, minSubtotal: 15000 } });
    expect(t.promoDiscount).toBe(0);
    expect(t.promoError).toMatch(/au moins/);
  });

  it("un montant fixe ne rend jamais le total négatif", () => {
    const t = computeTotals({ lines: [jersey()], promo: { code: "F", type: "FIXED", value: 50000, minSubtotal: null } });
    expect(t.total).toBe(0);
  });

  it("panier vide : pas de frais de port", () => {
    expect(computeTotals({ lines: [], shipping: { price: 490, freeOver: null } }).total).toBe(0);
  });
});

describe("flocage", () => {
  it("normalise le nom en majuscules", () => {
    expect(sanitizeFlockingName("  mbappé ", 12)).toEqual({ ok: true, value: "MBAPPÉ" });
    expect(sanitizeFlockingName("vini jr.", 12)).toEqual({ ok: true, value: "VINI JR." });
  });
  it("refuse les noms vides, trop longs ou avec caractères interdits", () => {
    expect(sanitizeFlockingName("", 12).ok).toBe(false);
    expect(sanitizeFlockingName("ABCDEFGHIJKLM", 12).ok).toBe(false);
    expect(sanitizeFlockingName("<script>", 12).ok).toBe(false);
    expect(sanitizeFlockingName("NOM123", 12).ok).toBe(false);
  });
  it("numéro entre 0 et 99", () => {
    expect(validFlockingNumber(0)).toBe(true);
    expect(validFlockingNumber(99)).toBe(true);
    expect(validFlockingNumber(100)).toBe(false);
    expect(validFlockingNumber(7.5)).toBe(false);
  });
});

describe("utilitaires", () => {
  it("parse les prix saisis en français", () => {
    expect(parsePrice("89,90")).toBe(8990);
    expect(parsePrice("89.9")).toBe(8990);
    expect(parsePrice("12 €")).toBe(1200);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("-3")).toBeNull();
    expect(formatPrice(8990).replace(/\s/g, " ")).toBe("89,90 €");
  });
  it("génère des slugs propres", () => {
    expect(slugify("Real Madrid Domicile 2025/26")).toBe("real-madrid-domicile-2025-26");
    expect(slugify("Sélection Équipe de France")).toBe("selection-equipe-de-france");
  });
  it("le rendu Markdown échappe le HTML", () => {
    const html = renderMarkdown("## Titre\n<script>alert(1)</script>\n- **gras**\n[lien](javascript:alert(1))");
    expect(html).toContain("<h3>Titre</h3>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<strong>gras</strong>");
    expect(html).not.toContain('href="javascript');
  });
});
