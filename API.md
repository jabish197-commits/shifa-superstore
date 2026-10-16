# API reference

Base: `/api/`. JSON requests use `Content-Type: application/json`. Protected requests require `Authorization: Bearer <access>`. Upload product/banner images with multipart/form-data.

| Path | Methods | Access |
| --- | --- | --- |
| health/ | GET | Public |
| accounts/register/ | POST | Public; creates customer |
| accounts/login/ | POST | Public; username/password returns access, refresh, user |
| accounts/refresh/ | POST | Public; refresh token rotates and invalidates old token |
| accounts/me/ | GET | Authenticated |
| accounts/logout/ | POST | Authenticated; body refresh token belongs to current user |
| products/ | GET, POST | Public read, Admin create |
| products/{id}/ | GET, PATCH, DELETE | Public visible read, Admin write |
| categories/, brands/, offers/, banners/, delivery-areas/ | GET, POST | Public active read, Admin create |
| categories/{id}/ and corresponding resource paths | GET, PATCH, DELETE | Public visible read, Admin write |
| delivery-areas/check/ | POST | Public; area + pincode |
| cart/ | GET, POST, DELETE | Customer; POST product_id + quantity adds/increments |
| cart/items/{id}/ | PATCH, DELETE | Owner; PATCH quantity replaces current amount |
| orders/ | GET, POST | Customer own list/create; Admin list all |
| orders/{id}/ | GET | Owner or Admin |
| orders/{id}/status/ | PATCH | Admin; status field |
| admin/dashboard/ | GET | Admin |

Product query parameters: search, category, brand, offer, min_price, max_price, in_stock, ordering, page. Ordering accepts name, price, created_at (prefix - for descending). Price ranges/sorting use original regular prices. Current discounted price appears in `pricing.final_price`. Products paginate by 12, orders by 20. Other lists return arrays. Admin reads include inactive records. Order lists accept status and page.

## Checkout payload

```json
{
  "checkout_key": "5fa706bb-5e61-49a1-bf80-4a6793a99b7d",
  "expected_total": "90.00",
  "recipient_name": "Customer name",
  "house_number": "12",
  "street": "Main Street",
  "area": "Your configured area",
  "city": "Your city",
  "district": "Your district",
  "state": "Tamil Nadu",
  "pincode": "629165",
  "mobile_number": "9876543210",
  "payment_method": "COD"
}
```

The cart supplies products and quantities. The server recalculates all prices/discounts and validates delivery and stock transactionally. `expected_total` must equal the fresh server total; it never controls the charged amount. Generate one UUID per checkout attempt and reuse it on retries. A repeated successful key returns the existing order with HTTP 200; a new order returns 201.

Errors: 400 validation, 401 unauthenticated/expired token, 403 role denied, 404 unavailable/not owned, 409 conflicting/dependent record, 429 authentication throttle, 503 temporary database contention. Field errors are JSON objects of messages; general errors use `detail`. Retry a 503 with the same checkout UUID. Never retry a checkout with a new UUID just because its response was lost.
