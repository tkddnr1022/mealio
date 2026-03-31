-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(50) NOT NULL,
    "platform_name" VARCHAR(20) NOT NULL,
    "platform_id" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "category" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "instructions" JSONB NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "cook_time" INTEGER NOT NULL,
    "image_url" VARCHAR(512),
    "servings" INTEGER NOT NULL DEFAULT 2,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCategory" (
    "id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeCategory_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2),
    "unit" VARCHAR(20),
    "is_optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_platform_name_platform_id_idx" ON "User"("platform_name", "platform_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_created_at_idx" ON "User"("created_at");

-- CreateIndex
CREATE INDEX "Recipe_category_difficulty_cook_time_created_at_idx" ON "Recipe"("category", "difficulty", "cook_time", "created_at");

-- CreateIndex
CREATE INDEX "Recipe_difficulty_cook_time_created_at_idx" ON "Recipe"("difficulty", "cook_time", "created_at");

-- CreateIndex
CREATE INDEX "Recipe_created_at_idx" ON "Recipe"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCategory_key_key" ON "RecipeCategory"("key");

-- CreateIndex
CREATE INDEX "RecipeCategory_is_active_display_order_idx" ON "RecipeCategory"("is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategory_key_key" ON "IngredientCategory"("key");

-- CreateIndex
CREATE INDEX "IngredientCategory_is_active_display_order_idx" ON "IngredientCategory"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "Ingredient_category_name_idx" ON "Ingredient"("category", "name");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipe_id_idx" ON "RecipeIngredient"("recipe_id");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredient_id_idx" ON "RecipeIngredient"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipe_id_ingredient_id_key" ON "RecipeIngredient"("recipe_id", "ingredient_id");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_category_fkey" FOREIGN KEY ("category") REFERENCES "RecipeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_category_fkey" FOREIGN KEY ("category") REFERENCES "IngredientCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
