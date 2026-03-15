-- Create Instructions table if it was missing (e.g. DB created before it was in CreateDB.sql).
-- Safe to run multiple times.
CREATE TABLE IF NOT EXISTS instructions (
  instruction_id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipe(recipe_id),
  instruction_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL
);
