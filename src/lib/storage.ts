import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const MAX_BYTES = 10 * 1024 * 1024;

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key, bucket: process.env.SUPABASE_STORAGE_BUCKET || "products" };
}

/** Vérifie la signature binaire pour ne pas faire confiance au seul type MIME envoyé par le navigateur */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString().startsWith("ftypavi")) return "image/avif";
  return null;
}

/**
 * Enregistre une photo produit. En production : Supabase Storage (bucket public).
 * Sans configuration (développement local) : dossier ./uploads servi par /api/uploads.
 */
export async function saveImage(file: File, folder = "products"): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde (10 Mo maximum).");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !ALLOWED.has(type)) throw new Error("Format non accepté : JPG, PNG, WEBP ou AVIF uniquement.");
  const name = `${folder}/${randomUUID()}.${ALLOWED.get(type)}`;

  const sb = supabaseConfig();
  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sb.key}`, "Content-Type": type, "x-upsert": "false", "Cache-Control": "31536000" },
      body: buf,
    });
    if (!res.ok) throw new Error(`Échec de l'envoi vers Supabase Storage (${res.status}).`);
    return `${sb.url}/storage/v1/object/public/${sb.bucket}/${name}`;
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("Stockage des images non configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
  }
  const dest = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return `/api/uploads/${name}`;
}

export async function deleteImage(url: string) {
  try {
    const sb = supabaseConfig();
    if (sb && url.startsWith(`${sb.url}/storage/v1/object/public/${sb.bucket}/`)) {
      const key = url.slice(`${sb.url}/storage/v1/object/public/${sb.bucket}/`.length);
      await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${key}`, { method: "DELETE", headers: { Authorization: `Bearer ${sb.key}` } });
    } else if (url.startsWith("/api/uploads/")) {
      const rel = url.slice("/api/uploads/".length);
      const full = path.join(LOCAL_UPLOAD_DIR, rel);
      if (full.startsWith(LOCAL_UPLOAD_DIR)) await unlink(full);
    }
  } catch {
    // une photo déjà absente n'empêche pas la suppression en base
  }
}
