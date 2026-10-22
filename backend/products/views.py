import re

from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin

from .bulk import export_csv, import_csv
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
        if self.action in {"export_products_csv", "import_products_csv"}:
            return [IsAdmin()]
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

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        product = self.get_object()
        ignored = {"pack", "of", "with", "and", "the", "for", "gm", "kg", "ml", "litre", "pcs", "piece", "pieces"}
        def keywords(name):
            return {({"scrubber": "scrub", "scouring": "scrub"}.get(word.rstrip("s"), word.rstrip("s"))) for word in re.findall(r"[a-z]+", name.lower()) if len(word) > 2 and word not in ignored}
        terms = keywords(product.name)
        if product.brand_id:
            terms -= keywords(product.brand.name)
        candidates = self.get_queryset().exclude(pk=product.pk).filter(
            is_active=True,
        ).filter(
            Q(category__isnull=True) | Q(category__is_active=True),
        ).filter(
            Q(brand__isnull=True) | Q(brand__is_active=True),
        )
        if product.category_id:
            candidates = candidates.filter(category_id=product.category_id)
        matches = [(len(terms & keywords(item.name)), item) for item in candidates]
        matches = [(score, item) for score, item in matches if score]
        matches.sort(key=lambda match: (-match[0], not match[1].in_stock, not bool(match[1].image), match[1].name, match[1].pk))
        return Response(self.get_serializer([item for _, item in matches[:8]], many=True).data)

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_products_csv(self, request):
        return export_csv(template=request.query_params.get("template") == "true")

    @action(detail=False, methods=["post"], url_path="import-csv")
    def import_products_csv(self, request):
        return Response(import_csv(request))
