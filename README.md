# Shifa Superstore

A React + Django store with two roles: Admin and Customer. Cash on Delivery only.

## Run the existing installation

Open two PowerShell terminals:

```powershell
cd F:\shifa-superstore
.\START-BACKEND.ps1
```

```powershell
cd F:\shifa-superstore
.\START-FRONTEND.ps1
```

Store: http://127.0.0.1:5175
React administration: http://127.0.0.1:5175/admin-dashboard
Django administration: http://127.0.0.1:8000/admin/
API health: http://127.0.0.1:8000/api/health/

The startup script uses port 5175 because an older server already occupies 5173 on this computer. `npm run dev` defaults to 5173; `START-FRONTEND.ps1 -Port 5173` also works once that port is free.

Use your existing admin credentials to sign in. Register creates only customers. The backend root URL is not a storefront; use port 5175.

Before taking orders, enter products, stock, and your actual active area/pincode pairs in the admin dashboard. No delivery areas or inventory are invented for your live store. The logo is in frontend/src/assets/shifa-logo.png.

## Fresh setup

Install Python 3.12 and Node.js 24. From backend, create a venv with `py -3.12 -m venv venv`, then run `venv\Scripts\python.exe -m pip install -r requirements.txt`, `venv\Scripts\python.exe manage.py migrate`, and `venv\Scripts\python.exe manage.py createsuperuser`. From frontend, run `npm ci`. On systems using enterprise certificate authorities, set `$env:NODE_USE_SYSTEM_CA='1'` before npm. Never disable TLS validation.

## Features

- Customer registration, JWT login, token refresh rotation/blacklisting, logout, and protected routes.
- Products, search, regular-price sorting/ranges, category, brand, availability and current-offer filters.
- Highest eligible discount wins; discounts do not stack. Product original prices stay unchanged.
- Admin CRUD for products/images, categories, brands, offers, banners, and delivery areas.
- Persistent server cart, quantity/stock validation, removal, and authoritative totals.
- Checkout checks the active normalized area AND six-digit pincode. Mobile numbers use Indian 10-digit validation.
- COD orders, atomic stock changes, duplicate-submit protection, historical item prices, and private customer order history.
- Admin order processing: Pending → Confirmed → Packed → Shipped → Delivered. Cancellation is allowed before shipping and restores stock once.
- Dashboard counts and delivered-order revenue. Delivery fee is currently zero.
- PostgreSQL configuration, production security settings, WhiteNoise, Docker/NGINX deployment templates.

## Verification

```powershell
cd backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test --noinput
cd ..\frontend
npm run build
```

Browser tests: see `frontend/e2e/README.md`. They use a separate SQLite database and never the store database.

## Configuration and operations

Django reads environment variables directly; it does not automatically load a backend .env file. Set PowerShell environment variables for local overrides. Docker Compose reads the root .env. Example files contain configuration names, not credentials.

For production deployment and database/media backup commands see `deployment/README.md`. Keep secrets, database files, media, and backups out of source control. Source archives do not contain customer data or uploaded images.

This implementation has no online payment gateway, vendor role, delivery-person role, email reset service, or shipping integration. Customers needing password recovery can contact the store; administrators can reset passwords in Django administration.
