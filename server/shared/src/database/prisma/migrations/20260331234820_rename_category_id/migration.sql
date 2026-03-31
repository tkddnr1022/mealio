/*
  Warnings:

  - You are about to drop the column `category` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Recipe` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_category_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_category_fkey";

-- DropIndex
DROP INDEX "Ingredient_category_name_idx";

-- DropIndex
DROP INDEX "Recipe_category_difficulty_cook_time_created_at_idx";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Ingredient_categoryId_name_idx" ON "Ingredient"("categoryId", "name");

-- CreateIndex
CREATE INDEX "Recipe_categoryId_difficulty_cook_time_created_at_idx" ON "Recipe"("categoryId", "difficulty", "cook_time", "created_at");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RecipeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IngredientCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
