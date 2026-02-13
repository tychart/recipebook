CREATE TYPE cookbook_role AS ENUM (
    'owner',
    'contributor',
    'viewer'
);

CREATE TABLE Users (
  User_ID SERIAL PRIMARY KEY,
  Username TEXT NOT NULL,
  Password Text NOT NULL,
  Email TEXT UNIQUE NOT NULL
);

CREATE TABLE AuthToken (
  Authtoken_ID SERIAL PRIMARY KEY,
  Authtoken TEXT NOT NULL,
  User_ID INTEGER REFERENCES Users(User_ID),
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cookbook (
  Book_ID SERIAL PRIMARY KEY,
  Book_Name TEXT NOT NULL,
  Owner_ID Integer REFERENCES Users(User_ID),
  Created_DtTm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Categories TEXT
);

CREATE TABLE Cookbook_Users (
    Book_ID INTEGER REFERENCES Cookbook(Book_ID),
    User_ID INTEGER REFERENCES Users(User_ID),
    Role cookbook_role not null,
    Added_DtTm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Book_ID, User_ID)
);

CREATE TABLE Recipe (
    Recipe_ID SERIAL PRIMARY KEY,
    Recipe_name TEXT Not NULL,
    Instructions Text not null,
    Notes Text,
    Author Text,
    Servings INTEGER,
    Creator_ID INTEGER REFERENCES Users(User_ID) not null,
    Modified_DtTm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Category TEXT,
    Recipe_Image Text,
    Recipe_Tags Text,
    Book_ID INTEGER REFERENCES Cookbook(Book_ID),
    PRIMARY KEY (Book_ID, User_ID)
);

CREATE TABLE Ingredients (
    Ingredient_ID SERIAL PRIMARY KEY,
    Recipe_ID INTEGER REFERENCES Recipe(Recipe_ID) not null,
    Amount Integer not null,
    Name text not null
);

