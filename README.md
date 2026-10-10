# Lift Club

A private gym log for a small group of friends. The React frontend talks to a FastAPI REST API; the API stores structured data in SQLite and media files under `backend/uploads/`.

## What the app does

- Members register or log in with a username and password.
- FYP shows the newest posts first; profiles show each member's posts.
- Posts contain a caption, one or more structured lifts, and optional photos or videos.
- Media is stored on disk; SQLite stores its paths and the post/lift data.
- The React frontend uses the REST API only. The API can also serve a future mobile client.

There are intentionally no likes, comments, followers, DMs, recommendations, or public discovery features. Registration is open to anyone who can reach the API, so only share the app on a trusted network until account access is restricted.

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer and npm

## Installation

From the `gym-social` directory, create the local environment file:

```bash
cp .env.example .env
```

Replace `SESSION_SECRET` in `.env` with a private random value before using the app outside local development. Keep `.env` untracked.

Generate a value with:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
```

`SESSION_COOKIE_SECURE=false` is for local HTTP development. Set it to `true` when serving over HTTPS.

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The database tables are created automatically the first time the API starts. To create the development accounts, run:

```bash
python -m app.seed
```

## Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
```

## Run the application

Start the backend from `backend/`:

```bash
.venv/bin/uvicorn app.main:app --reload
```

Start the frontend from `frontend/`:

```bash
npm run dev
```

Open the Vite URL shown in the frontend terminal, usually `http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend on port 8000. The API health check is `/api/health`, and interactive API docs are at `http://127.0.0.1:8000/docs`.

### Share on your local network

If friends are on the same Wi-Fi, keep the backend bound to `127.0.0.1` and start Vite so it listens on the LAN:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Find the host computer's LAN IP with `hostname -I`, then share `http://YOUR-IP:5173` (for example, `http://192.168.1.25:5173`). Allow port 5173 through the host firewall if needed. Everyone uses the same database and upload folder on the host, so leave the computer and both servers running. Guest Wi-Fi may block devices from seeing one another.

## Development users

`python -m app.seed` creates these local-only accounts. It is safe to rerun; existing usernames are left unchanged.

| Username | Password |
| --- | --- |
| `alex` | `alex123` |
| `max` | `max123` |
| `john` | `john123` |

The login screen also supports account creation. Registration is open to anyone who can reach the API; keep the service on a trusted network for this private group app. Change or replace the development credentials before sharing a hosted instance.

## Database and media

The default database is `backend/gym_social.db` when commands run from `backend/`. Override `DATABASE_URL` in the root `.env` to use another SQLite file. Passwords are stored as Argon2 hashes. Signed HTTP-only sessions last seven days; logout clears the session cookie.

Images and videos are stored as files under `backend/uploads/`, with only their paths stored in SQLite. The API accepts common JPEG, PNG, WebP, GIF, MP4, WebM, and QuickTime MIME types, up to 25 MB per file and 6 files per post.

Lift weights are whole-number unsigned 32-bit values (`0` to `4,294,967,295`). On startup, the backend migrates an older SQLite `FLOAT` weight column to `INTEGER`, rounding existing values to the nearest whole number while preserving their posts.

Login artwork is stored in `frontend/public/images/`; use images you have permission to use.

### Data model

| Entity | Stored information |
| --- | --- |
| `User` | Username, Argon2 password hash, display name, optional profile image, creation time |
| `Post` | Author, caption, creation time |
| `PostMedia` | Post, local file path, image/video type, display order |
| `Lift` | Post, exercise name, unsigned 32-bit whole-number weight, unit, reps |

Lift weights are stored as SQLite integers from `0` to `4,294,967,295`. On startup, an older SQLite `FLOAT` weight column is migrated to `INTEGER`, rounding existing values to the nearest whole number while preserving posts. Back up `backend/gym_social.db` and `backend/uploads/` together. Run only one backend instance against this SQLite database.

## Build and preview

Build the frontend and run its TypeScript check:

```bash
cd frontend
npm run build
```

The bundle is written to `frontend/dist/`. Preview the static build with:

```bash
npm run preview
```

The Vite `/api` and `/uploads` proxy is enabled for `npm run dev`, not preview. Preview serves the frontend only; a deployed setup must reverse-proxy `/api` and `/uploads` to FastAPI on the same origin, or configure `VITE_API_BASE_URL` and backend CORS for the frontend origin.

### Render deployment

This repository includes a root `Dockerfile` that builds the React frontend and serves it from the FastAPI web service. Deploy one Render Web Service from the repository root using the Docker runtime. The resulting routes are same-origin:

```text
https://YOUR-APP.onrender.com           React frontend
https://YOUR-APP.onrender.com/api       FastAPI API
https://YOUR-APP.onrender.com/uploads   Uploaded media
```

Create a Render Postgres database and set these Web Service environment variables:

```text
DATABASE_URL=<Render Postgres connection string>
SESSION_SECRET=<long-random-value>
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
```

Set the Render health check path to `/api/health`. The Docker build uses `VITE_API_BASE_URL=/api`, so no separate frontend service or frontend API URL is needed. Keep the same `SESSION_SECRET` permanently; changing it invalidates existing sessions.

Do not use the default SQLite URL on Render; the service filesystem is ephemeral. Uploaded media also needs a Render persistent disk or object storage if it must survive redeploys. If using a persistent disk, set `UPLOAD_DIR` to its mounted path.

The one-service deployment keeps the frontend and API on the same origin, so browser third-party-cookie restrictions do not affect authentication. `CORS_ORIGINS` can remain at its default because browser requests are same-origin.

The frontend must be rebuilt after changing its API base URL; Vite embeds `VITE_*` values during the build. A username may contain only lowercase letters, numbers, `_`, `.`, and `-`; spaces and `@` are rejected during registration.

## Tests

From `backend/` with its virtual environment active:

```bash
python -m pytest
```

The suite covers login and sessions, registration, profiles, posts, and the SQLite lift-weight migration.

## Debugging

### Backend with VS Code

Open the `gym-social` directory as the VS Code workspace and select `backend/.venv/bin/python` as the interpreter. The included `.vscode/launch.json` provides the **Lift Club API** configuration.

1. Set a breakpoint in a route or service, for example `backend/app/posts/service.py`.
2. Open **Run and Debug**, select **Lift Club API**, and press F5.
3. Use the frontend in the browser and inspect backend output in the VS Code Debug Console.

The debugger configuration does not use auto-reload, so breakpoints stay attached to the server process. For ordinary development, stop the debugger and run Uvicorn with `--reload` instead. The VS Code Python and Python Debugger extensions are required.

### Frontend and API

Run both development servers and use the browser Developer Tools. **Console** shows React/runtime errors; **Network** shows API requests, response codes, and validation messages. Vite refreshes frontend changes automatically. API docs are at `http://127.0.0.1:8000/docs`; Uvicorn request logs appear in the backend terminal. Add `--log-level debug` to the Uvicorn command for more server logging.

### Common problems

- **Port 8000 is busy:** stop the other API process. If you change the backend port, update `frontend/vite.config.ts` too.
- **A seed login is rejected:** run `.venv/bin/python -m app.seed` from `backend/` and use the credentials listed above.
- **An API route returns 404:** confirm the backend is running from `backend/` and use the Vite URL on port 5173 during development.
- **A post returns 422:** each post needs at least one lift; weights must be whole numbers in the uint32 range and reps must be positive.
- **Media is missing:** check the backend terminal, file type, 25 MB per-file limit, and that `backend/uploads/` is writable.

## API overview

All API routes are under `/api`. Registration, login, and logout manage a signed HTTP-only cookie; other listed routes require login.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Create an account and sign in |
| `POST` | `/auth/login` | Log in |
| `POST` | `/auth/logout` | Clear the session |
| `GET` | `/auth/me` | Get the signed-in user |
| `GET` | `/users/{username}` | Get a profile |
| `GET` | `/users/{username}/posts` | Get a member's posts |
| `GET` | `/posts` | Get the newest-first feed |
| `GET` | `/posts/{post_id}` | Get one post |
| `POST` | `/posts` | Create a post with lifts and optional media |
| `DELETE` | `/posts/{post_id}` | Delete your own post |

## Project structure

```text
gym-social/
├── .env.example
├── .vscode/launch.json          # VS Code backend debugger
├── ARCHITECTURE.md
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── uploads/                 # Uploaded media
│   ├── app/
│   │   ├── main.py              # FastAPI app and route registration
│   │   ├── seed.py              # Development accounts
│   │   ├── auth/                # Registration, login, hashing, sessions
│   │   ├── config/              # Environment-backed settings
│   │   ├── database/            # Engine, models, SQLite migration
│   │   ├── lifts/               # Lift validation and uint32 bounds
│   │   ├── media/               # Upload validation and local storage
│   │   ├── posts/               # Post routes, services, repositories, schemas
│   │   ├── users/               # Profile routes and persistence
│   │   └── tests/               # API and migration tests
└── frontend/
    ├── package.json
    ├── public/images/           # Login artwork
    └── src/
        ├── api/                 # REST client calls
        ├── components/          # Navigation, posts, avatars, media
        ├── hooks/               # Shared authentication state
        ├── pages/               # Login, FYP, profile, post creation
        ├── styles/              # Responsive UI and design tokens
        └── types/               # API data shapes
```

Route handlers validate requests and delegate business rules to services; repositories own database queries. The frontend contains presentation and API calls only. See [ARCHITECTURE.md](ARCHITECTURE.md) for ownership boundaries and the future mobile-client path.