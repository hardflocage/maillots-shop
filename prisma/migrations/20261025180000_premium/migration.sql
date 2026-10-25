-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "hostInfo" TEXT NOT NULL DEFAULT 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
ADD COLUMN     "legalAddress" TEXT,
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "mediator" TEXT,
ADD COLUMN     "payApplePay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payCard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payGooglePay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payPaypal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicationDirector" TEXT,
ADD COLUMN     "returnAddress" TEXT,
ADD COLUMN     "returnDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "vatNumber" TEXT,
ALTER COLUMN "aboutText" SET DEFAULT '';


-- Ancien texte provisoire « À propos » : on le vide pour qu'il ne s'affiche plus
UPDATE "ShopSettings" SET "aboutText" = '' WHERE "aboutText" LIKE 'Présentez ici votre boutique%';
