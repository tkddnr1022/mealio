-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "cooking_method" VARCHAR(50),
ADD COLUMN     "dish_type" VARCHAR(50),
ADD COLUMN     "nutrition" JSONB,
ADD COLUMN     "cooking_tip" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "source" VARCHAR(50),
ADD COLUMN     "source_recipe_id" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_source_source_recipe_id_key" ON "Recipe"("source", "source_recipe_id");
