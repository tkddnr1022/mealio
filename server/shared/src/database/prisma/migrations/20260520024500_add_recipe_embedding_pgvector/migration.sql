CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "RecipeEmbedding" (
    "recipe_id" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "document_text" TEXT NOT NULL,
    "embedding_model" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeEmbedding_pkey" PRIMARY KEY ("recipe_id")
);

CREATE INDEX "RecipeEmbedding_updated_at_idx"
ON "RecipeEmbedding"("updated_at" DESC);

CREATE INDEX "RecipeEmbedding_embedding_idx"
ON "RecipeEmbedding"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

ALTER TABLE "RecipeEmbedding"
ADD CONSTRAINT "RecipeEmbedding_recipe_id_fkey"
FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
