# RecipeBook
## Pitch

Have you ever called your friends or family asking for a recipe? Have you ever saved the photo of the recipe to your photos, been unable to find it, and had to ask them for the recipe all over again? This project seeks to solve that issue. This online recipe book allows you and your family and friends to save and share recipes into an joint book. It facilitates easy recipe sharing and access, so you never have to wonder where that recipe is again!

## Summary of (hopefully future) features

* **Recipe storage and management**
  * Create, edit, and delete recipes
  * Structured recipe format (ingredients, steps, notes, metadata)
  * Support for personal and shared recipes

* **Easy recipe ingestion**
  * Upload recipes manually via a form
  * Upload images or screenshots of recipes
  * OCR to extract text from images
  * LLM-assisted formatting to normalize recipes into a consistent structure

* **Cookbooks**
  * Group recipes into cookbooks
  * Create private or shared cookbooks
  * Simple organization for large recipe collections

* **Sharing and collaboration**
  * Share cookbooks via a link
  * Invite users to join a cookbook
  * Role-based permissions (view, edit, admin)
  * Collaborative editing of shared recipes

* **Search**
  * Fast full-text search across saved recipes
  * Search by recipe name, ingredients, or instructions
  * Designed to stay responsive even with large collections

* **Responsive and mobile-friendly UI**
  * Works well on desktop and mobile screen sizes
  * Clean, simple interface optimized for everyday use
  * Designed with touch interaction in mind

* **Background processing for long-running tasks**
  * Asynchronous job handling for OCR and LLM processing
  * Job status tracking and result retrieval
  * UI remains responsive while jobs run in the background

* **Self-hosted and privacy-friendly**
  * Fully self-hostable using Docker
  * Single `docker-compose.yml` deployment
  * No required external services (optional LLM integrations)

* **Extensible architecture**
  * Clean separation between frontend, backend, and worker services
  * Well-defined API boundaries
  * Designed to be easy to extend with additional features or integrations

## Team Members
- Elinor Clark, 
- Elaina Hales, 
- Carley Andelin, 
- Jordan Brockbank, 
- Ben Hall, 
- Nic Samson, 
- Tyler Chartrand, 
- Eric Leech

## Building for Development

Steps to deploy project so far


Clone the repo to your local machine:

```bash
git clone git@github.com:tychart/recipebook.git

or 

git clone https://github.com/tychart/recipebook.git
```


### Backend:

```bash
cd server/
python3 -m venv .venv
pip install "fastapi[standard]"
```

To run for development:

```bash
fastapi dev test.py
```

To run for (semi) production:

```bash
uvicorn test:app --host 0.0.0.0 --port 8000 --workers 4
```


### Frontend:

```bash
cd web/
npm install
```

To run for development:

```bash
npm run dev
```

To run for (semi) production:

```bash
npm run build
```

Then serve the files in the `web/dist` folder that this command generates with a standard web server (Nginx, Apache, etc)
