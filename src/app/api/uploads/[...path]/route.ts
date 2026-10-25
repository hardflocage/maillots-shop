import { readFile } from "fs/promises";
import path from "path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Sert les photos enregistrées localement (mode développement, sans Supabase Storage). */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const full = path.join(LOCAL_UPLOAD_DIR, rel);
  if (!full.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(full).slice(1).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(full);
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
