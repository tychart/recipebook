CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE cookbook_role AS ENUM (
  'owner',
  'contributor',
  'viewer'
);

CREATE TABLE Users (
  User_ID SERIAL PRIMARY KEY,
  Username TEXT NOT NULL,
  Password TEXT NOT NULL,
  Email TEXT UNIQUE NOT NULL
);

CREATE TABLE AuthToken (
  Authtoken_ID SERIAL PRIMARY KEY,
  Authtoken TEXT NOT NULL,
  User_ID INTEGER NOT NULL REFERENCES Users(User_ID),
  Created_DtTm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cookbook (
  Book_ID SERIAL PRIMARY KEY,
  Book_Name TEXT NOT NULL,
  Owner_ID INTEGER NOT NULL REFERENCES Users(User_ID),
  Created_DtTm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Categories TEXT NOT NULL DEFAULT 'Main'
);

CREATE TABLE Cookbook_Users (
  Book_ID INTEGER NOT NULL REFERENCES Cookbook(Book_ID),
  User_ID INTEGER NOT NULL REFERENCES Users(User_ID),
  Role cookbook_role NOT NULL,
  Added_DtTm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Book_ID, User_ID)
);

CREATE TABLE Recipe (
  Recipe_ID SERIAL PRIMARY KEY,
  Recipe_name TEXT NOT NULL,
  Instructions TEXT NOT NULL,
  Description TEXT,
  Notes TEXT,
  Servings INTEGER NOT NULL DEFAULT 1,
  Creator_ID INTEGER NOT NULL REFERENCES Users(User_ID),
  Modified_DtTm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Category TEXT NOT NULL DEFAULT 'Main',
  Recipe_Image_URL TEXT,
  Recipe_Tags TEXT,
  Book_ID INTEGER NOT NULL REFERENCES Cookbook(Book_ID),
  embedding VECTOR(1536)
);


CREATE TABLE Ingredients (
  Ingredient_ID SERIAL PRIMARY KEY,
  Recipe_ID INTEGER NOT NULL REFERENCES Recipe(Recipe_ID),
  Amount FLOAT NOT NULL,
  Unit TEXT NOT NULL,
  Name TEXT NOT NULL
);

CREATE INDEX recipe_embedding_idx
ON Recipe
USING hnsw (embedding vector_cosine_ops);

Insert into users (username, password, email) values ('User1', 'password', 'user1@gmail.com');

Insert into cookbook (Book_Name, Owner_ID) values ('Favorites', 1);

INSERT INTO recipe (recipe_name, instructions, servings, creator_id, book_id)
VALUES ('Fluffy Buttermilk Pancakes', 
    '1. Melt the 6 Tablespoons (85g) of butter first. Microwave or stovetop—either is fine. Set aside to slightly cool until step 3. You don''t want it piping hot.
2. In a large bowl, preferably with a pour spout, whisk the flour, sugar, baking powder, baking soda, and salt together until combined. Set aside.
3. In another large bowl, whisk the eggs, buttermilk, and vanilla extract together until combined. Whisk in the melted butter. Pour the wet ingredients into the dry ingredients and gently whisk to combine. Make sure there are no patches of dry flour at the bottom of the bowl. The batter is thick and a few lumps are fine. Set aside as you heat the stove.
4. Heat a griddle or large skillet over medium heat. Coat generously with butter or nonstick spray. Once it''s hot, drop/pour a heaping 1/4 cup of batter on the griddle. Cook until the edges look set and you notice holes in the pancake''s surface around the border, about 2 minutes. Flip and cook the other side until cooked through, about 1-2 more minutes. Coat griddle/skillet with butter or nonstick spray, if needed, for each batch of pancakes.
5. Keep pancakes warm in a preheated 200°F (93°C) oven until all pancakes are cooked. Serve pancakes immediately with your choice of toppings.
6. Cover and store leftover pancakes in the refrigerator for up to 5 days.', 
    5, 1, 1);

-- run searches such as:
-- SELECT Recipe_ID, Recipe_name
-- FROM Recipe
-- ORDER BY embedding <=> '[0.01, 0.02, ...]'
-- LIMIT 5;