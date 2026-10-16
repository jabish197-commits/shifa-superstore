# Production deployment preparation

The Docker templates use PostgreSQL 17, Python 3.12/Gunicorn, Node 24 for the frontend build, and NGINX for the SPA, public media and static files. These templates have not been deployed to a hosting account. Backend tests and browser tests were run locally with SQLite; a production PostgreSQL smoke test remains part of deployment.

## First deployment on a Linux server with Docker Compose

1. Copy the source to the server. Copy root `.env.example` to `.env` and set the actual domain, HTTPS origins, database password, and a random secret. Generate the secret with `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
2. Place a trusted HTTPS reverse proxy in front of `127.0.0.1:8080`. It must overwrite `X-Forwarded-Proto` with `https` and preserve the original Host. Do not expose the database or backend container ports. The included NGINX passes the trusted proxy header to Django.
3. Run:

```sh
docker compose build
docker compose up -d db
docker compose run --rm backend python manage.py migrate --noinput
docker compose run --rm backend python manage.py collectstatic --noinput
docker compose run --rm backend python manage.py check --deploy
docker compose run --rm backend python manage.py createsuperuser
docker compose up -d
```

4. Verify `/api/health/`, register/login, add an actual product, configure the intended delivery area, and complete a test COD order over HTTPS. Test uploaded images and Django admin. Use a real browser to verify refresh and logout. Keep DEBUG disabled.
5. Schedule `docker compose exec -T backend python manage.py flushexpiredtokens` daily. Configure host log rotation, uptime checks, disk monitoring and an edge rate limit for login/register/refresh. Built-in DRF throttles use per-process memory; use a shared Django cache or edge throttle for a multi-worker deployment.

## Database and media backups

Store backups outside the server and restrict access because they contain customer records. Example commands for a Linux shell:

```sh
mkdir -p backups
docker compose exec -T db pg_dump -U shifa -d shifa -Fc > backups/shifa.dump
docker compose exec -T backend tar -C /app -czf - media > backups/media.tar.gz
```

Restore into a separately provisioned environment and verify before any live replacement. Preserve the database, media, and secret key across upgrades. Never run `docker compose down -v` on a live installation unless you intentionally want to destroy all persistent store data.

## Upgrade

Back up database/media first. Build new images, apply migrations using a one-off backend container, collect static files, then restart backend/frontend. Verify health, checkout, stock and admin access. Run migrations once, not independently in every Gunicorn worker.

## Existing local data

The supplied archive excludes the local SQLite database, users, secrets and uploaded media. A fresh production deployment starts empty. If migrating an existing store, plan a tested SQLite-to-PostgreSQL transfer separately; do not copy a SQLite file into a PostgreSQL volume.

## External database or media hosting

Set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD and DB_SSLMODE=require for a managed PostgreSQL service. Local development defaults to SQLite. Public media currently uses a persistent volume; configure a storage backend separately if using object storage. The trusted proxy must reject oversized uploads; included NGINX permits up to 6 MB per request and image validation limits files to 5 MB.
