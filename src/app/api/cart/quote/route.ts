import { NextResponse } from "next/server";
import { buildQuote, cartInputSchema } from "@/lib/quote";

export async function POST(req: Request) {
  const parsed = cartInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
  const { quote } = await buildQuote(parsed.data);
  return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
}
