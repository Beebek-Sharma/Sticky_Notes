# Railway Deployment Guide for Sticky Notes

This application is fully productionized and configured to deploy smoothly on **[Railway](https://railway.com/)**.

You can deploy it in **two ways**:
1. **Option 1 (Recommended - Single Full-Stack Service)**: 1-click deployment from the repo root. Django serves the React frontend, static files (via WhiteNoise), and the REST API. Zero CORS configuration required, uses only 1 Railway service.
2. **Option 2 (Decoupled Services)**: Deploy backend and frontend as two independent services in a Railway project.

---

## Option 1: Single Full-Stack Service (Recommended & Fastest)

### Step 1: Push your Code to GitHub
Ensure all latest changes are pushed to your GitHub repository:
```bash
git add -A
git commit -m "Configure Railway production deployment"
git push origin main
```

### Step 2: Create a New Project on Railway
1. Go to [railway.com](https://railway.com/) and log in.
2. Click **"+ New Project"** $\to$ **"Deploy from GitHub repo"**.
3. Select your repository: `Beebek-Sharma/Sticky_Notes`.
4. Leave the root directory as `/` (default). Railway will automatically detect [`nixpacks.toml`](file:///d:/sticky%20note/nixpacks.toml) and build both the frontend and backend.

### Step 3: Configure Environment Variables
In Railway, navigate to your service $\to$ **Variables** tab, and add:
- `DJANGO_SECRET_KEY`: Generate a random secret string (e.g. `railway-prod-secret-key-xyz123...`).
- `DJANGO_DEBUG`: `False` (defaults to `False` automatically on Railway).
- `DJANGO_ALLOWED_HOSTS`: `*` (or your specific `.up.railway.app` domain).

### Step 4: Generate Domain
1. In your service's **Settings** tab, scroll to **Networking** $\to$ click **"Generate Domain"**.
2. You will get a live URL such as `https://sticky-notes-production.up.railway.app`.
3. Open the URL in your browser:
   - `/` $\to$ React Tactile Canvas UI
   - `/api/notes/` $\to$ Django REST Framework API
   - `/health/` $\to$ Service health check (`{"status": "ok", "database": "connected"}`)
   - `/admin/` $\to$ Django Admin portal

### Step 5 (Optional): Add PostgreSQL Database
By default, the application runs on SQLite. If you want a managed PostgreSQL database:
1. In your Railway project canvas, click **"+ New"** $\to$ **"Database"** $\to$ **"Add PostgreSQL"**.
2. Railway will automatically populate the `DATABASE_URL` variable in your backend service.
3. Django will detect `DATABASE_URL` and migrate to PostgreSQL automatically without modifying code!

---

## Option 2: Decoupled Backend & Frontend Services

If you prefer deploying the Django backend and React frontend as two distinct Railway services:

### 1. Deploy the Backend Service:
1. In Railway, click **"+ New"** $\to$ **"GitHub Repo"** $\to$ Select repo.
2. In service **Settings** $\to$ **General** $\to$ Set **Root Directory** to `/backend`.
3. In **Variables**, add:
   - `DJANGO_SECRET_KEY`: Random string
   - `DJANGO_DEBUG`: `False`
   - `CORS_ALLOWED_ORIGINS`: URL of your frontend service (e.g. `https://your-frontend.up.railway.app`)
4. In **Settings** $\to$ **Networking**, click **"Generate Domain"** to get the backend URL.

### 2. Deploy the Frontend Service:
1. In the same project, click **"+ New"** $\to$ **"GitHub Repo"** $\to$ Select the same repo.
2. In service **Settings** $\to$ **General** $\to$ Set **Root Directory** to `/frontend`.
3. In **Variables**, add:
   - `REACT_APP_API_BASE_URL`: `https://your-backend.up.railway.app/api`
4. In **Settings** $\to$ **Networking**, click **"Generate Domain"**.

---

## Health Check & Monitoring
Railway monitors the `/health/` endpoint configured in [`railway.json`](file:///d:/sticky%20note/railway.json).
- Returns HTTP `200` with `{"status": "ok", "database": "connected"}` when healthy.
- Returns HTTP `503` if the database is unreachable.
