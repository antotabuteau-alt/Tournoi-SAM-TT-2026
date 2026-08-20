-- CreateEnum
CREATE TYPE "CategoryBracketType" AS ENUM ('CLASSIC', 'INTEGRAL_BY_LEVEL', 'INTEGRAL_OFFICIAL_FFTT', 'MAIN_PLUS_CONSOLATION');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "bracketType" "CategoryBracketType" NOT NULL DEFAULT 'CLASSIC',
ADD COLUMN     "poolCount" INTEGER,
ADD COLUMN     "repechage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "tableRangeEnd" INTEGER,
ADD COLUMN     "tableRangeStart" INTEGER;
