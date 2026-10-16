from rest_framework import serializers

from products.models import Product

from .models import Offer


class OfferSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ["id", "title", "discount_percent"]
        read_only_fields = fields


class ProductPricingSerializer(serializers.Serializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    offer = OfferSummarySerializer(read_only=True, allow_null=True)


class OfferSerializer(serializers.ModelSerializer):
    products = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), many=True, allow_empty=False,
    )

    class Meta:
        model = Offer
        fields = [
            "id", "title", "description", "products", "discount_percent",
            "starts_at", "ends_at", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at is None:
            starts_at = Offer._meta.get_field("starts_at").get_default()
            attrs["starts_at"] = starts_at
        if ends_at is not None and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "End time must be after start time."})
        return attrs
