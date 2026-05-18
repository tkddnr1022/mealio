CREATE TABLE "UserRecipeRecommendation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(10,4) NOT NULL,
    "reason" VARCHAR(255),
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRecipeRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRecipeRecommendation_user_id_recipe_id_key"
ON "UserRecipeRecommendation"("user_id", "recipe_id");

CREATE UNIQUE INDEX "UserRecipeRecommendation_user_id_rank_key"
ON "UserRecipeRecommendation"("user_id", "rank");

CREATE INDEX "UserRecipeRecommendation_user_id_score_idx"
ON "UserRecipeRecommendation"("user_id", "score" DESC);

CREATE INDEX "UserRecipeRecommendation_updated_at_idx"
ON "UserRecipeRecommendation"("updated_at" DESC);

ALTER TABLE "UserRecipeRecommendation"
ADD CONSTRAINT "UserRecipeRecommendation_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRecipeRecommendation"
ADD CONSTRAINT "UserRecipeRecommendation_recipe_id_fkey"
FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
