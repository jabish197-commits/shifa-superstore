from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, SAFE_METHODS
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from .models import DeliveryArea, normalize_area
from .serializers import DeliveryAreaSerializer, DeliveryCheckSerializer


class DeliveryAreaViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAreaSerializer

    def get_permissions(self):
        return [AllowAny()] if self.action == "check" or self.request.method in SAFE_METHODS else [IsAdmin()]

    def get_queryset(self):
        queryset = DeliveryArea.objects.all()
        return queryset if IsAdmin().has_permission(self.request, self) else queryset.filter(is_active=True)

    @action(detail=False, methods=["post"])
    def check(self, request):
        serializer = DeliveryCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        available = DeliveryArea.objects.filter(
            area_key=normalize_area(data["area"]), pincode=data["pincode"], is_active=True,
        ).exists()
        return Response({"available": available, "cod_available": available, "message":
            "Delivery Available. Cash on Delivery Available." if available else "Sorry, we currently don't deliver to this area."})
