# Architecture

The React/TypeScript frontend owns navigation, forms, and presentation. It communicates with the FastAPI backend only through `/api` REST endpoints; it never reads the database. The API is the contract a future mobile client can use as well.

FastAPI routes validate requests and delegate to small service functions. Services contain application rules, while repositories contain SQLAlchemy queries and persistence. SQLite models live in `backend/app/database/models.py`.

Registration validates a username, display name, and password, then stores an Argon2 password hash. Login verifies that hash. Both set a signed, HTTP-only session cookie that lasts seven days; protected routes read the user id from that session, and logout clears it. Registration is open to people who can reach the API, so keep a hosted instance limited to the intended group. Local development uses `SESSION_COOKIE_SECURE=false`; set it to `true` behind HTTPS and use a private `SESSION_SECRET` when hosting the app.

Posts, media references, and lifts are separate records. Uploaded image and video bytes live under `backend/uploads/`; SQLite stores only their `/uploads/...` paths. Media validation/storage is isolated under `backend/app/media/`, so that implementation can later be replaced without changing the API contract.

No web-specific logic is required by the backend API, so a mobile app can call the same endpoints and use the same session flow with cookie support.