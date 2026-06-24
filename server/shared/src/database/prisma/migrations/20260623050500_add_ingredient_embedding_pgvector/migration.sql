CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "IngredientEmbedding" (
    "ingredient_id" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "embedding_model" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientEmbedding_pkey" PRIMARY KEY ("ingredient_id")
);

CREATE INDEX "IngredientEmbedding_updated_at_idx"
ON "IngredientEmbedding"("updated_at" DESC);

ALTER TABLE "IngredientEmbedding"
ADD CONSTRAINT "IngredientEmbedding_ingredient_id_fkey"
FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
