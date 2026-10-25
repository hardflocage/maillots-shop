/**
 * Génère des visuels de maillots GÉNÉRIQUES (SVG) pour les produits de démonstration.
 * Ils ne représentent aucun produit réel : remplacez-les par vos vraies photos depuis l'administration.
 */
type Pattern = "plain" | "stripes" | "hoops" | "sash" | "halves" | "pinstripes";
export type JerseySpec = { base: string; accent: string; trim: string; pattern: Pattern; retro?: boolean };

const BODY = "M150 70 L215 48 Q250 74 285 48 L350 70 L432 128 L398 214 L360 196 L360 548 Q250 566 140 548 L140 196 L102 214 L68 128 Z";

function patternLayer(s: JerseySpec) {
  switch (s.pattern) {
    case "stripes":
      return Array.from({ length: 6 }, (_, i) => `<rect x="${150 + i * 40}" y="0" width="20" height="600" fill="${s.accent}"/>`).join("");
    case "pinstripes":
      return Array.from({ length: 22 }, (_, i) => `<rect x="${60 + i * 18}" y="0" width="3" height="600" fill="${s.accent}" opacity=".55"/>`).join("");
    case "hoops":
      return Array.from({ length: 8 }, (_, i) => `<rect x="0" y="${120 + i * 60}" width="500" height="30" fill="${s.accent}"/>`).join("");
    case "sash":
      return `<path d="M90 120 L170 60 L430 520 L350 580 Z" fill="${s.accent}"/>`;
    case "halves":
      return `<rect x="250" y="0" width="250" height="600" fill="${s.accent}"/>`;
    default:
      return `<rect x="0" y="420" width="500" height="10" fill="${s.accent}" opacity=".5"/>`;
  }
}

export function jerseySvg(s: JerseySpec, side: "front" | "back") {
  const collar =
    side === "front"
      ? s.retro
        ? `<path d="M215 48 Q250 74 285 48 L285 60 L262 96 L238 96 L215 60 Z" fill="${s.trim}"/><path d="M238 96 L262 96 L258 120 L242 120 Z" fill="${s.base}" stroke="${s.trim}" stroke-width="3"/>`
        : `<path d="M215 48 Q250 74 285 48 L278 60 Q250 104 222 60 Z" fill="${s.trim}"/>`
      : `<path d="M215 48 Q250 64 285 48 L282 56 Q250 74 218 56 Z" fill="${s.trim}"/>`;
  const crest =
    side === "front"
      ? `<g transform="translate(305 150)"><path d="M0 0 h34 v22 q0 18 -17 26 q-17 -8 -17 -26 Z" fill="${s.trim}" opacity=".95"/><path d="M6 6 h22 v14 q0 11 -11 16 q-11 -5 -11 -16 Z" fill="${s.accent}"/></g>
         <g transform="translate(168 156)" opacity=".9"><path d="M0 12 l10 -12 l10 12 l-10 12 Z" fill="${s.trim}"/></g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 625" width="1000" height="1250">
<defs>
  <radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#26262b"/><stop offset="1" stop-color="#111114"/></radialGradient>
  <linearGradient id="shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  <linearGradient id="light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="body"><path d="${BODY}"/></clipPath>
  <filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="500" height="625" fill="url(#bg)"/>
<g transform="translate(0 20)" filter="url(#drop)">
  <path d="${BODY}" fill="${s.base}"/>
  <g clip-path="url(#body)">${patternLayer(s)}
    <path d="M68 128 L102 214 L140 196 L140 180 L80 120 Z" fill="${s.trim}" opacity=".9"/>
    <path d="M432 128 L398 214 L360 196 L360 180 L420 120 Z" fill="${s.trim}" opacity=".9"/>
    <rect x="0" y="0" width="500" height="600" fill="url(#shade)"/><rect x="0" y="0" width="500" height="600" fill="url(#light)"/>
    <path d="M250 70 L250 560" stroke="#000" stroke-opacity=".06" stroke-width="2"/>
  </g>
  ${collar}${crest}
</g>
</svg>`;
}
