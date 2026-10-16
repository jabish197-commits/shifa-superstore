from django.core.validators import RegexValidator
from rest_framework import serializers
from accounts.serializers import UserSerializer
from delivery_areas.models import pincode_validator
from .models import Order, OrderItem


class CheckoutSerializer(serializers.Serializer):
    checkout_key = serializers.UUIDField()
    expected_total = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0)
    recipient_name = serializers.CharField(max_length=120)
    house_number = serializers.CharField(max_length=100)
    street = serializers.CharField(max_length=200)
    area = serializers.CharField(max_length=120)
    city = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=6, validators=[pincode_validator])
    mobile_number = serializers.CharField(max_length=10, validators=[
        RegexValidator(r"^[6-9][0-9]{9}$", "Enter a valid ten-digit Indian mobile number."),
    ])
    payment_method = serializers.ChoiceField(choices=["COD"], default="COD")


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "original_price", "unit_price", "line_total"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(source="user", read_only=True)
    number = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "number", "customer", "recipient_name", "house_number", "street", "area",
            "city", "district", "state", "pincode", "mobile_number", "payment_method",
            "status", "total", "created_at", "updated_at", "items",
        ]
        read_only_fields = fields


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
