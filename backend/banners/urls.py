from rest_framework.routers import SimpleRouter

from .views import BannerViewSet

router = SimpleRouter()
router.register("banners", BannerViewSet, basename="banner")

urlpatterns = router.urls
