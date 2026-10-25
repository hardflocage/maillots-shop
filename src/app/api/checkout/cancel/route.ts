import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelCheckout } from "@/lib/checkout";

export async function POST(req: Request) {
  const token = z.object({ token: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!token.success) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: await cancelCheckout(token.data.token) });
}
