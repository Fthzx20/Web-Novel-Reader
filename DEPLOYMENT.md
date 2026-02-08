# Deployment Guide (Vercel frontend + VPS backend)

## Backend (VPS)

### 1) Build

```
cd backend
GOOS=linux GOARCH=amd64 go build -o app
```

### 2) Environment

Copy the example and fill real values:

```
cp .env.example .env
```

Required for production:
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAILS`
- `MODERATION_PASSWORD`
- `CORS_ORIGINS` (your Vercel domain)
- `TRUSTED_PROXIES` (reverse proxy IPs or `127.0.0.1` if direct)

Set `GIN_MODE=release` in the service environment for production.

### 3) Run (systemd)

Create `/etc/systemd/system/malaz-backend.service`:

```
[Unit]
Description=Malaz Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/malaz/backend
Environment=GIN_MODE=release
ExecStart=/opt/malaz/backend/app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```
sudo systemctl daemon-reload
sudo systemctl enable malaz-backend
sudo systemctl start malaz-backend
```

### 4) Reverse proxy (optional)

If you use Nginx, forward to `http://127.0.0.1:8080` and set your SSL there.

## Frontend (Vercel)

1) Import the `frontend` folder into Vercel.
2) Set `NEXT_PUBLIC_API_URL` to your backend URL.
3) (Optional) set `NEXT_PUBLIC_ADMIN_API_KEY` if you use API key auth.
4) Deploy.

## Database

Use a managed Postgres or a self-hosted Postgres on the VPS. Update `DATABASE_URL` accordingly.

## Smoke tests

- `GET /health` returns `{"status":"ok"}`
- Login/register works
- Admin dashboard loads with `Authorization: Bearer <token>`
