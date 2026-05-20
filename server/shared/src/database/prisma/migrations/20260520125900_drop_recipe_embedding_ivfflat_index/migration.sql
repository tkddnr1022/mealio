-- Prisma schema does not define ivfflat index on embedding; safe on DBs that never had it.
DROP INDEX IF EXISTS "RecipeEmbedding_embedding_idx";
