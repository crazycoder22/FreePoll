-- CreateTable
CREATE TABLE "PollField" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterInfo" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "VoterInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PollField" ADD CONSTRAINT "PollField_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterInfo" ADD CONSTRAINT "VoterInfo_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterInfo" ADD CONSTRAINT "VoterInfo_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "PollField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
