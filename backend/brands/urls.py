from rest_framework.routers import SimpleRouter

from .views import BrandViewSet

router = SimpleRouter()
router.register("brands", BrandViewSet, basename="brand")

urlpatterns = router.urls
