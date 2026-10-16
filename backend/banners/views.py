from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin

from .models import Banner
from .serializers import BannerSerializer


class BannerViewSet(ModelViewSet):
    serializer_class = BannerSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        banners = Banner.objects.all()
        if not IsAdmin().has_permission(self.request, self):
            banners = banners.filter(is_active=True)
        return banners
