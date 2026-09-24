# Sticky Notes

A productionized, full-stack Sticky Notes board built with **Django REST Framework** and **React**.

Users can create, organize, reposition, edit, color-code, and delete sticky notes on a responsive 2D canvas with immediate UI feedback and persistent relational storage in SQLite.

---

## Directory Structure

```text
Sticky_Notes/
├── backend/                  <-- Django REST Framework Backend
│   ├── backend/              <-- Project settings, ASGI/WSGI, root URLs
│   ├── notes/                <-- Notes app (models, views, serializers, admin, tests)
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
│
├── frontend/                 <-- React Application
│   ├── public/
│   ├── src/
│   │   ├── components/       <-- NoteBoard and Note components
│   │   ├── api.js            <-- Centralized Axios API client
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json
│   └── README.md
│
├── README.md
└── .gitignore
```

---

## Architecture

```text
React Frontend (frontend/)
    │  [Pointer events, debounced editing, keyboard accessibility]
    ▼
Axios Client (src/api.js)
    │  [REST HTTP requests, error handling, base URL configuration]
    ▼
Django REST Framework (backend/notes/)
    │  [ModelViewSet, NoteSerializer, input validation, color palette enforcement]
    ▼
SQLite Database (backend/db.sqlite3)
    │  [Persisted notes with coordinates, text, color, and timestamps]
```

---

## Features

- **Smooth Repositioning**: Pointer-event drag handling accounts for cursor offset so notes drag naturally without jumping.
- **Keyboard Accessibility**: Accessible drag handles support arrow key nudging (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) with `Shift` for larger steps.
- **Debounced Text Editing**: Text changes are debounced (600ms) with immediate save-on-blur, preventing excessive API requests while typing.
- **Safe Color Palette**: Controlled palette (`#fef08a`, `#bbf7d0`, `#bae6fd`, `#fbcfe8`, `#fed7aa`, `#e9d5ff`) with server-side validation against CSS injection.
- **Graceful Error Handling & Loading**: Visual feedback for note saving, initial fetch loading, deletion confirmation, and dismissible error banners with retry options.
- **Full Relational Persistence**: All note data persists across server restarts and page refreshes.

---

## Prerequisites

- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 18+ (tested on Node 26.x with npm 11.x)

---

## Backend Setup & Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. Run backend tests:
   ```bash
   python manage.py test
   ```

6. Start the development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   The REST API will be accessible at `http://127.0.0.1:8000/api/notes/` and the Django Admin at `http://127.0.0.1:8000/admin/`.

---

## Frontend Setup & Execution

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run frontend tests:
   ```bash
   npm test -- --watchAll=false
   ```

4. Start the React development server:
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`.

5. Production build:
   ```bash
   npm run build
   ```

---

## Environment Configuration

Both backend and frontend support environment variables for deployment and custom port binding:

### Backend (`backend/`)
| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(development fallback key)* | Secret key for Django cryptographic signing |
| `DJANGO_DEBUG` | `True` | Set to `False` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` | Comma-separated list of allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of permitted origins |

### Frontend (`frontend/`)
| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_BASE_URL` | `http://localhost:8000/api` | Base URL for REST API endpoints |

---

## REST API Reference

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/notes/` | List all notes | 200 OK |
| `POST` | `/api/notes/` | Create a new note | 201 Created |
| `GET` | `/api/notes/<id>/` | Retrieve a note | 200 OK / 404 |
| `PUT` | `/api/notes/<id>/` | Replace all fields of a note | 200 OK / 400 |
| `PATCH` | `/api/notes/<id>/` | Partially update fields (`text`, `color`, `x`, `y`) | 200 OK / 400 |
| `DELETE` | `/api/notes/<id>/` | Delete a note | 204 No Content |
