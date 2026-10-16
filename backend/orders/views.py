from django.db.models import Sum
from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAdmin, IsCustomer
from products.models import Product
from .models import Order
from .serializers import OrderSerializer, CheckoutSerializer, OrderStatusSerializer
from .services import place_order, change_status, TRANSITIONS


class OrderPagination(PageNumberPagination):
    page_size = 20


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    pagination_class = OrderPagination

    def get_permissions(self):
        return [IsCustomer()] if self.action == "create" else [IsAdmin()] if self.action == "update_status" else [IsAuthenticated()]

    def get_queryset(self):
        queryset = Order.objects.select_related("user").prefetch_related("items")
        if not IsAdmin().has_permission(self.request, self):
            queryset = queryset.filter(user=self.request.user)
        selected = self.request.query_params.get("status")
        if selected and self.action == "list":
            if selected not in Order.Status.values:
                raise ValidationError({"status": "Invalid order status."})
            queryset = queryset.filter(status=selected)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order, created = place_order(request.user, serializer.validated_data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = change_status(order.pk, serializer.validated_data["status"])
        return Response(OrderSerializer(updated).data)


class DashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        orders = Order.objects.all()
        return Response({
            "total_products": Product.objects.count(),
            "total_orders": orders.count(),
            "pending_orders": orders.filter(status="Pending").count(),
            "delivered_orders": orders.filter(status="Delivered").count(),
            "delivered_revenue": str(orders.filter(status="Delivered").aggregate(total=Sum("total"))["total"] or "0.00"),
            "recent_orders": OrderSerializer(orders.select_related("user").prefetch_related("items")[:5], many=True).data,
            "status_transitions": TRANSITIONS,
        })
