from rest_framework import serializers

from offers.serializers import ProductPricingSerializer
from offers.services import get_product_pricing

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    pricing = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)

    brand_name = serializers.CharField(source="brand.name", read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "category", "category_name",
            "brand", "brand_name", "price", "stock", "image",
            "is_active", "in_stock", "pricing", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "in_stock", "created_at", "updated_at"]

    def get_pricing(self, product):
        return ProductPricingSerializer(get_product_pricing(product)).data


class ProductFilterSerializer(serializers.Serializer):
    offer = serializers.IntegerField(min_value=1, required=False)
    category = serializers.IntegerField(min_value=1, required=False)
    brand = serializers.IntegerField(min_value=1, required=False)
    min_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False,
    )
    max_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False,
    )
    in_stock = serializers.BooleanField(required=False)

    def validate(self, attrs):
        minimum = attrs.get("min_price")
        maximum = attrs.get("max_price")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise serializers.ValidationError(
                {"max_price": "Maximum price must be at least the minimum price."}
            )
        return attrs
