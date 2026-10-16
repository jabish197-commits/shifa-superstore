from django.db.models import Q
from django.utils import timezone
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin

from .models import Product
from .serializers import ProductFilterSerializer, ProductSerializer


class ProductPagination(PageNumberPagination):
    page_size = 12


class ProductViewSet(ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "price", "created_at"]
    ordering = ["-created_at", "-id"]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        products = Product.objects.select_related("category", "brand").prefetch_related("offers")
        visible = Q(is_active=True) & (
            Q(category__isnull=True) | Q(category__is_active=True)
        ) & (
            Q(brand__isnull=True) | Q(brand__is_active=True)
        )
        if not IsAdmin().has_permission(self.request, self):
            products = products.filter(visible)

        if self.action == "list":
            filters = ProductFilterSerializer(data=self.request.query_params.dict())
            filters.is_valid(raise_exception=True)
            values = filters.validated_data
            if "offer" in values:
                now = timezone.now()
                products = products.filter(offers__id=values["offer"], offers__is_active=True, offers__starts_at__lte=now, offers__ends_at__gt=now).distinct()
            if "category" in values:
                products = products.filter(category_id=values["category"])
            if "brand" in values:
                products = products.filter(brand_id=values["brand"])
            if "min_price" in values:
                products = products.filter(price__gte=values["min_price"])
            if "max_price" in values:
                products = products.filter(price__lte=values["max_price"])
            if values.get("in_stock") is True:
                products = products.filter(visible, stock__gt=0)
            elif values.get("in_stock") is False:
                products = products.exclude(visible & Q(stock__gt=0))
        return products

    def filter_queryset(self, queryset):
        if self.action == "list":
            return super().filter_queryset(queryset)
        return queryset
