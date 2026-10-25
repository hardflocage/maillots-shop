import { NextResponse } from "next/server";
import { checkoutSchema, startCheckout } from "@/lib/checkout";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!(await rateLimit("checkout", 20, 10 * 60_000))) return NextResponse.json({ error: "Trop de tentatives, réessaie dans quelques minutes." }, { status: 429 });
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const msg = field === "acceptTerms" ? "Merci d'accepter les conditions générales de vente." : field === "email" ? "Adresse e-mail invalide." : "Vérifie les informations de livraison.";
    return NextResponse.json({ error: msg, field }, { status: 400 });
  }
  const user = await getCurrentUser();
  const result = await startCheckout(parsed.data, user?.id ?? null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ url: result.url });
}
