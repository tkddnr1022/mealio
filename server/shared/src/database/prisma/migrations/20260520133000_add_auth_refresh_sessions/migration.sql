CREATE TABLE "auth_refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_session_id" UUID,
    "last_used_at" TIMESTAMP(3),
    "user_agent" VARCHAR(512),
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refresh_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_refresh_sessions_user_id_idx" ON "auth_refresh_sessions"("user_id");
CREATE INDEX "auth_refresh_sessions_expires_at_idx" ON "auth_refresh_sessions"("expires_at");
CREATE INDEX "auth_refresh_sessions_revoked_at_idx" ON "auth_refresh_sessions"("revoked_at");
CREATE INDEX "auth_refresh_sessions_replaced_by_session_id_idx" ON "auth_refresh_sessions"("replaced_by_session_id");

ALTER TABLE "auth_refresh_sessions"
ADD CONSTRAINT "auth_refresh_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_refresh_sessions"
ADD CONSTRAINT "auth_refresh_sessions_replaced_by_session_id_fkey"
FOREIGN KEY ("replaced_by_session_id") REFERENCES "auth_refresh_sessions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
