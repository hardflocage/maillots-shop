import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; role: "CUSTOMER" | "ADMIN" }) {
  const token = await signSession({ uid: user.id, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Utilisateur connecté (vérifié en base), ou null */
export async function getCurrentUser() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
}

export async function requireUser(next = "/compte") {
  const user = await getCurrentUser();
  if (!user) redirect(`/compte/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

/** Le rôle est revérifié en base à chaque appel : un admin rétrogradé perd l'accès immédiatement. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/compte/connexion?next=/admin");
  return user;
}
