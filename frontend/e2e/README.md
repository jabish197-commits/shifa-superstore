# Isolated browser tests

Tests require installed Google Chrome (Playwright channel `chrome`). These fixtures are test-only; never load them into the store database.

Terminal 1, from backend:

```powershell
$env:DJANGO_DB_PATH = Join-Path $env:TEMP 'shifa-e2e.sqlite3'
$env:DJANGO_MEDIA_ROOT = Join-Path $env:TEMP 'shifa-e2e-media'
.\venv\Scripts\python.exe qa\seed_e2e.py
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8001 --noreload
```

Terminal 2, from frontend:

```powershell
$env:VITE_DEV_PORT='5174'
$env:VITE_PROXY_TARGET='http://127.0.0.1:8001'
npm run dev
```

Terminal 3, from frontend:

```powershell
npm run test:e2e
```

Re-seed before repeating the suite because it creates customers, an order and a category. Fixture setup refuses any database filename other than `shifa-e2e.sqlite3`. Test results/screenshots go in `frontend/test-results`. Close test terminals afterward; use fresh terminals for the real store so environment overrides do not carry over.
