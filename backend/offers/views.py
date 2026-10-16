from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin
from products.models import Product

from .models import Offer
from .serializers import OfferSerializer


class OfferViewSet(ModelViewSet):
    serializer_class = OfferSerializer
    filter_backends = [SearchFilter]
    search_fields = ["title", "description"]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        offers = Offer.objects.all()
        if IsAdmin().has_permission(self.request, self):
            return offers.prefetch_related("products")
        now = timezone.now()
        visible_products = Product.objects.filter(is_active=True).filter(
            Q(category__isnull=True) | Q(category__is_active=True),
            Q(brand__isnull=True) | Q(brand__is_active=True),
        )
        return offers.filter(
            is_active=True, starts_at__lte=now, ends_at__gt=now,
            products__in=visible_products,
        ).distinct().prefetch_related(Prefetch("products", queryset=visible_products))

    def filter_queryset(self, queryset):
        if self.action == "list":
            return super().filter_queryset(queryset)
        return queryset
