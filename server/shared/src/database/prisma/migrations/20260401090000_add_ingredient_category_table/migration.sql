-- CreateTable
CREATE TABLE "IngredientCategory" (
    "id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategory_key_key" ON "IngredientCategory"("key");

-- CreateIndex
CREATE INDEX "IngredientCategory_is_active_display_order_idx" ON "IngredientCategory"("is_active", "display_order");

-- Backfill categories from existing Ingredient data
INSERT INTO "IngredientCategory" ("id", "key", "name", "display_order", "is_active")
SELECT DISTINCT
    i."category",
    CONCAT('CATEGORY_', i."category"),
    CONCAT('카테고리 ', i."category"),
    i."category",
    true
FROM "Ingredient" i
ON CONFLICT ("id") DO NOTHING;

-- Set canonical category metadata for known ids
INSERT INTO "IngredientCategory" ("id", "key", "name", "display_order", "is_active")
VALUES
    (1, 'VEGETABLE', '채소', 1, true),
    (2, 'MEAT', '육류', 2, true),
    (3, 'SEASONING', '양념', 3, true),
    (4, 'GRAIN', '곡류', 4, true),
    (5, 'DAIRY', '유제품', 5, true)
ON CONFLICT ("id") DO UPDATE
SET
    "key" = EXCLUDED."key",
    "name" = EXCLUDED."name",
    "display_order" = EXCLUDED."display_order",
    "is_active" = EXCLUDED."is_active";

-- AddForeignKey
ALTER TABLE "Ingredient"
ADD CONSTRAINT "Ingredient_category_fkey"
FOREIGN KEY ("category") REFERENCES "IngredientCategory"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
