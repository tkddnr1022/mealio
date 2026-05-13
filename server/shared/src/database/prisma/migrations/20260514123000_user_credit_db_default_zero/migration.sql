-- 비즈니스 초기 크레딧은 앱(`DEFAULT_USER_CREDIT_*`)·시드에서 주입. DB 기본은 보조용 0.
ALTER TABLE "User" ALTER COLUMN "credit_balance" SET DEFAULT 0;
ALTER TABLE "User" ALTER COLUMN "credit_monthly_limit" SET DEFAULT 0;
