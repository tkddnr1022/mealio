/*
  Warnings:

  - You are about to drop the column `view_count` on the `Recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "view_count";

-- CreateTable
CREATE TABLE "RecipeStats" (
    "recipe_id" INTEGER NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeStats_pkey" PRIMARY KEY ("recipe_id")
);

-- CreateIndex
CREATE INDEX "RecipeStats_view_count_recipe_id_idx" ON "RecipeStats"("view_count" DESC, "recipe_id" DESC);

-- CreateIndex
CREATE INDEX "RecipeStats_like_count_recipe_id_idx" ON "RecipeStats"("like_count" DESC, "recipe_id" DESC);

-- AddForeignKey
ALTER TABLE "RecipeStats" ADD CONSTRAINT "RecipeStats_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
