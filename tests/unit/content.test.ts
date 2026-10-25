import { describe, expect, it } from "vitest";
import { fillPlaceholders, missingPlaceholders, shippingSummary } from "@/lib/content";

describe("pages éditables à balises", () => {
  const values = { boutique: "MAILLOT", siret: "", email: "contact@exemple.fr", livraison: "" };

  it("remplace les balises renseignées", () => {
    expect(fillPlaceholders("Bienvenue chez {{boutique}} : {{ email }}", values)).toBe("Bienvenue chez MAILLOT : contact@exemple.fr");
  });

  it("retire la ligne d'une balise vide au lieu d'afficher un texte provisoire", () => {
    const out = fillPlaceholders("- Nom : {{boutique}}\n- SIRET : {{siret}}\n- E-mail : {{email}}", values);
    expect(out).toBe("- Nom : MAILLOT\n- E-mail : contact@exemple.fr");
  });

  it("retire un titre de section devenu vide", () => {
    const out = fillPlaceholders("## Société\n- SIRET : {{siret}}\n\n## Contact\n{{email}}", values);
    expect(out).not.toContain("Société");
    expect(out).toContain("## Contact");
  });

  it("liste les balises manquantes", () => {
    expect(missingPlaceholders("{{siret}} {{email}} {{livraison}}", values)).toEqual(["siret", "livraison"]);
  });

  it("résume les vrais modes de livraison", () => {
    const out = shippingSummary([{ name: "Domicile", description: null, price: 490, freeOver: 7000, deliveryTime: null }]);
    expect(out).toContain("**Domicile**");
    expect(out).toMatch(/4,90/);
    expect(out).toMatch(/70,00/);
  });
});
