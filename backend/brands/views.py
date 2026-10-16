from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin

from .models import Brand
from .serializers import BrandSerializer


class BrandViewSet(ModelViewSet):
    serializer_class = BrandSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name", "description"]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        brands = Brand.objects.all()
        if not IsAdmin().has_permission(self.request, self):
            brands = brands.filter(is_active=True)
        return brands

    def filter_queryset(self, queryset):
        if self.action == "list":
            return super().filter_queryset(queryset)
        return queryset

    def destroy(self, request, *args, **kwargs):
        brand = self.get_object()
        try:
            brand.delete()
        except ProtectedError:
            return Response(
                {"detail": "Reassign this brand's products before deleting it."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
