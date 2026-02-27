# Backend/Server plans/thoughts
## Backend plans

Currently just a dumping ground for thoughts on the backend functionality and how to go about it

## API Calls
### Authentication
***
### Recipes
#### CRUD
* **Create Recipe**
  * Gets all data for single recipe (will flesh out exactly what data this is once the database structure is decided) and user data
  * Passes it to the database to be created/inserted into the database
  * ?Pass back to the front end the new recipe info from database? (or if not necessary don't bother?)
  * At least pass back to the front end info on if the creation passed or failed and any thrown errors
* **Edit Recipe**
  * Get edited recipe data with the recipe's unique identifier(s)
  * Pass it to the database to edit the existing recipe
  * ?Pass back to the front end the edited recipe info from database? (or if not necessary don't bother?)
  * At least pass back to the front end info on if the edit passed or failed and any thrown errors
* **Delete Recipe**
  * Get recipe unique identifer(s) from frontend
  * Pass to database to delete
  * Pass back to the front end info on if the deletion passed or failed and any thrown errors
* **Get Recipe**
  * Get recipe unique identifer(s) from frontend
  * Pass to database to get recipe data
  * Pass back to the front end recipe data and if the get passed or failed and any thrown errors
#### ADD/SHARE
* **Copy Recipe To Cookbook**
  * Get Recipe unique identifier(s) and Cookbook unique identifer(s)
  * Send to database to create duplicate Recipe and add to Cookbook
  * Pass back to the front end info on if the copy passed or failed and any thrown errors
***
### COOKBOOK
* **Create Cookbook**
  * Get Cookbook data and User unique identifier(s)
  * Pass to database to create Cookbook
  * ?Pass back to front end newly created Cookbook
  * At least pass back to the front end info on if the creation passed or failed and any thrown errors
* **?Edit Cookbook**
  * Don't know if this would be needed or wanted
* **Delete Cookbook**
  * Get Cookbook unique identifier(s)
  * Pass to database to delete
  * Pass back to the front end info on if the deletion passed or failed and any thrown errors
* **Share Cookbook**
  * Get Cookbook unique identifier(s), User unique identifer(s), and user role
  * Pass to database to share Cookbook
  * Pass back to the front end info on if the share passed or failed and any thrown errors
