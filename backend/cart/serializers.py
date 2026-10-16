from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from offers.services import get_product_pricing
from products.serializers import ProductSerializer


class AddItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=99, default=1)


class QuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=99)


def cart_data(cart, request):
    items = cart.items.select_related("product__category", "product__brand").prefetch_related("product__offers")
    now = timezone.now()
    result = []
    subtotal = Decimal("0.00")
    for item in items:
        pricing = get_product_pricing(item.product, at=now)
        line_total = pricing["final_price"] * item.quantity
        subtotal += line_total
        available = item.product.in_stock and item.product.stock >= item.quantity
        result.append({
            "id": item.pk, "product": ProductSerializer(item.product, context={"request": request}).data,
            "quantity": item.quantity, "unit_price": str(pricing["final_price"]), "line_total": str(line_total),
            "available": available,
            "message": "" if available else "This product is unavailable or has insufficient stock.",
        })
    return {"id": cart.pk, "items": result, "subtotal": str(subtotal), "total": str(subtotal),
            "item_count": sum(item["quantity"] for item in result),
            "can_checkout": bool(result) and all(item["available"] for item in result)}
