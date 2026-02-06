# Nocturne Shelf

Minimalist novel reader with an admin studio.

## Stack

- Frontend: Next.js + Tailwind + shadcn-style UI
- Backend: Go + Gin (in-memory store)

## Run the frontend

```
cd frontend
npm install
npm run dev
```

## Run the backend

```
cd backend
go mod tidy
go run .
```

### Backend environment

Optional environment variables:

```
PORT=8080
API_KEY=your-secret
DATABASE_URL=postgres://user:pass@localhost:5432/dbname?sslmode=disable
DB_MAX_CONNS=10
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=30m
JWT_SECRET=dev-secret
JWT_TTL=24h
```

You can also place them in `backend/.env` and the backend will load it on startup.

If `API_KEY` is set, write endpoints require `X-API-Key`.

### Database roles (optional)

You can create a least-privileged app role and keep `web_admin` for migrations:

```
CREATE ROLE app_user WITH LOGIN PASSWORD 'yourpassword';
GRANT CONNECT ON DATABASE malazdb TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

Point `DATABASE_URL` to `app_user` for the app runtime.

### Auth endpoints

```
POST /auth/register
POST /auth/login
```

Both return `{ token, user }`.

Authenticated user endpoints (send `Authorization: Bearer <token>`):

```
GET /me/history
POST /me/history
```

Auth users and reading history are now stored in Postgres.

## API base URL

The frontend expects the API at `http://localhost:8080` by default. You can override it with:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```
