from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import health
from orders.views import DashboardView

urlpatterns = [
    path("api/health/", health, name="health"),
    path("api/", include("products.urls")),
    path("api/", include("categories.urls")),
    path("api/", include("brands.urls")),
    path("api/", include("offers.urls")),
    path("api/", include("banners.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/", include("delivery_areas.urls")),
    path("api/", include("orders.urls")),
    path("api/admin/dashboard/", DashboardView.as_view(), name="admin-dashboard"),
    path("admin/", admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
