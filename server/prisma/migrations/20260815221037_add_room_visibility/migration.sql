-- CreateEnum
CREATE TYPE "DataRoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "DataRoom" ADD COLUMN     "visibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE';
