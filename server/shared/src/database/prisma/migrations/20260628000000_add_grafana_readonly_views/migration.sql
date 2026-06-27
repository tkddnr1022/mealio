-- Grafana domain snapshot views (queried by Grafana PostgreSQL datasource)
CREATE OR REPLACE VIEW grafana_recipe_catalog_snapshot AS
SELECT
  COUNT(*) FILTER (WHERE "is_published") AS published_count,
  COUNT(*) FILTER (WHERE NOT "is_published") AS unpublished_count,
  COUNT(*) AS total_count,
  COUNT(DISTINCT "source") FILTER (WHERE "source" IS NOT NULL) AS source_count
FROM "Recipe";

CREATE OR REPLACE VIEW grafana_recipe_by_source AS
SELECT
  COALESCE("source", 'unknown') AS source,
  COUNT(*) AS recipe_count,
  COUNT(*) FILTER (WHERE "is_published") AS published_count
FROM "Recipe"
GROUP BY COALESCE("source", 'unknown');

CREATE OR REPLACE VIEW grafana_embedding_coverage AS
SELECT
  'recipe'::text AS entity_type,
  (SELECT COUNT(*) FROM "Recipe" WHERE "is_published") AS total_count,
  (
    SELECT COUNT(*)
    FROM "Recipe" r
    INNER JOIN "RecipeEmbedding" e ON r.id = e.recipe_id
    WHERE r."is_published"
  ) AS with_embedding_count,
  (
    SELECT COUNT(*)
    FROM "Recipe" r
    LEFT JOIN "RecipeEmbedding" e ON r.id = e.recipe_id
    WHERE r."is_published" AND e.recipe_id IS NULL
  ) AS missing_embedding_count
UNION ALL
SELECT
  'ingredient'::text AS entity_type,
  (SELECT COUNT(*) FROM "Ingredient") AS total_count,
  (
    SELECT COUNT(*)
    FROM "Ingredient" i
    INNER JOIN "IngredientEmbedding" e ON i.id = e.ingredient_id
  ) AS with_embedding_count,
  (
    SELECT COUNT(*)
    FROM "Ingredient" i
    LEFT JOIN "IngredientEmbedding" e ON i.id = e.ingredient_id
    WHERE e.ingredient_id IS NULL
  ) AS missing_embedding_count;

CREATE OR REPLACE VIEW grafana_user_signups_daily AS
SELECT
  date_trunc('day', "created_at")::date AS day,
  COUNT(*) AS signups
FROM "User"
GROUP BY 1;

CREATE OR REPLACE VIEW grafana_recommendation_coverage AS
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM "UserRecipeRecommendation") AS users_with_recommendations,
  (SELECT COUNT(*) FROM "User") AS total_users,
  (
    SELECT ROUND(AVG(rank_count)::numeric, 2)
    FROM (
      SELECT COUNT(*) AS rank_count
      FROM "UserRecipeRecommendation"
      GROUP BY user_id
    ) per_user
  ) AS avg_ranks_per_user;
