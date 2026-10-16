from rest_framework.routers import SimpleRouter
from .views import DeliveryAreaViewSet
router = SimpleRouter()
router.register("delivery-areas", DeliveryAreaViewSet, basename="delivery-area")
urlpatterns = router.urls
