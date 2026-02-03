# RecipieBook

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