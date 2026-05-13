-- AlterTable: 챗봇 크레딧 필드 (기존 행은 기본값으로 채움)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credit_balance" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credit_monthly_limit" INTEGER NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE IF NOT EXISTS "chatbot_credit_deductions" (
    "stream_channel_id" VARCHAR(80) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_credit_deductions_pkey" PRIMARY KEY ("stream_channel_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chatbot_credit_deductions_user_id_idx" ON "chatbot_credit_deductions"("user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chatbot_credit_deductions_user_id_fkey'
  ) THEN
    ALTER TABLE "chatbot_credit_deductions" ADD CONSTRAINT "chatbot_credit_deductions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
