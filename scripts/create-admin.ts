/**
 * Crée (ou promeut) un compte administrateur.
 * Usage : npm run create-admin -- vous@exemple.fr "MotDePasseSolide"
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name = "Administrateur"] = process.argv.slice(2);
  if (!email || !password || password.length < 10) {
    console.error('Usage : npm run create-admin -- email@exemple.fr "mot-de-passe-de-10-caracteres-min"');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN", passwordHash },
    create: { email: email.toLowerCase(), passwordHash, name, role: "ADMIN" },
  });
  console.log(`✓ ${user.email} est administrateur. Connexion : /compte/connexion puis /admin`);
}

main().finally(() => prisma.$disconnect());
