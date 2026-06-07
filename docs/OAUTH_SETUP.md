# OAuth Setup — Google + GitHub

Archon ships with three sign-in paths:

| Path                   | Endpoint              | When to use                                          |
| ---------------------- | --------------------- | ---------------------------------------------------- |
| **Google OAuth**       | `GET  /auth/google`   | Production users with a Google account               |
| **GitHub OAuth**       | `GET  /auth/github`   | Production users with a GitHub account               |
| **Dev login** (no key) | `POST /auth/dev`      | Local development without setting up real OAuth      |

Until you configure real client IDs, only the **Dev login** path works. The two OAuth buttons on `/login` will return `501 Not Configured` errors.

---

## 1. Google OAuth

### Register the app

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. **Create credentials → OAuth client ID → Web application.**
3. **Authorized redirect URIs** — add **both**:
   - `http://localhost:8000/auth/google/callback` (dev)
   - `https://<your-domain>/auth/google/callback` (prod)
4. Copy the **Client ID** and **Client secret**.

### Add to `.env`

```bash
GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
```

### Frontend & backend URLs

The backend uses these to build the redirect:

```bash
BACKEND_URL=http://localhost:8000       # where /auth/google/callback lives
FRONTEND_URL=http://localhost:5173      # where users land after login
```

In production:
```bash
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://app.your-domain.com
```

---

## 2. GitHub OAuth

### Register the app

1. Go to <https://github.com/settings/developers> → **New OAuth App**.
2. **Authorization callback URL** — add:
   - `http://localhost:8000/auth/github/callback` (dev)
   - `https://<your-domain>/auth/github/callback` (prod)
3. Copy the **Client ID** and generate a **Client secret**.

### Add to `.env`

```bash
GITHUB_CLIENT_ID=Iv1.your_client_id_here
GITHUB_CLIENT_SECRET=your_secret_here
```

---

## 3. JWT signing & session

```bash
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=replace-me-with-64-hex-chars

# Hash secret for API keys (independent of JWT_SECRET)
# Generate the same way: python -c "import secrets; print(secrets.token_hex(32))"
API_KEY_HASH_SECRET=replace-me-with-another-64-hex-chars
```

Both secrets **must** be set to strong random values in production. The startup validator in `app/main.py::_validate_env` will refuse to boot if the defaults are still in place when `DEBUG=false`.

---

## 4. Full `.env` template

```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./archon.db
# Production: DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/archon

# Secrets — generate fresh values, never commit
JWT_SECRET=
API_KEY_HASH_SECRET=

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# OAuth — leave blank to disable that provider
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# LLM providers — at least one required for real blueprint generation
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Debug mode (relaxes startup validation; allows /auth/dev)
DEBUG=true
```

---

## 5. Verify

After setting the values, restart the backend:

```bash
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Hit the redirect endpoint directly to confirm:

```bash
curl -i http://localhost:8000/auth/google
# Expected: HTTP/1.1 307 Temporary Redirect → accounts.google.com/o/oauth2/v2/auth?...
```

If you instead see `501 Not Configured`, the `GOOGLE_CLIENT_ID` env var didn't load — confirm the `.env` file is in the project root and restart.

---

## 6. Common pitfalls

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` from Google | The callback URL in the cloud console must **exactly** match `BACKEND_URL + /auth/google/callback` — protocol, port, trailing slash all count. |
| `bad_verification_code` from GitHub | The auth code is single-use and 10-minute-lived; don't retry without restarting the flow. |
| Cookie not set after login | Your browser is blocking 3rd-party cookies. In production set `BACKEND_URL` and `FRONTEND_URL` to the **same parent domain** (e.g. `api.archon.ai` + `app.archon.ai`) so `samesite=lax` works. |
| `Invalid session` on `/auth/me` | `JWT_SECRET` changed since the cookie was issued. Have the user sign in again. |
