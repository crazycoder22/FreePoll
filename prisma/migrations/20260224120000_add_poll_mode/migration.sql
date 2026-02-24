-- CreateEnum
CREATE TYPE "PollMode" AS ENUM ('POLL', 'LIKER');

-- AlterTable: add mode column
ALTER TABLE "Poll" ADD COLUMN "mode" "PollMode" NOT NULL DEFAULT 'POLL';

-- DropIndex: old unique constraint on Vote
DROP INDEX "Vote_pollId_voterToken_key";

-- CreateIndex: new unique constraint allowing one like per option per voter
CREATE UNIQUE INDEX "Vote_pollId_optionId_voterToken_key" ON "Vote"("pollId", "optionId", "voterToken");
