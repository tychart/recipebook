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
  Amount Integer NOT NULL,
  Unit TEXT NOT NULL,
  Name TEXT NOT NULL
);

CREATE INDEX recipe_embedding_idx
ON Recipe
USING hnsw (embedding vector_cosine_ops);

-- run searches such as:
-- SELECT Recipe_ID, Recipe_name
-- FROM Recipe
-- ORDER BY embedding <=> '[0.01, 0.02, ...]'
-- LIMIT 5;