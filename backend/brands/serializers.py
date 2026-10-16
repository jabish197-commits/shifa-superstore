from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Brand


class BrandSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=100,
        validators=[UniqueValidator(
            queryset=Brand.objects.all(),
            lookup="iexact",
            message="A brand with this name already exists.",
        )],
    )

    class Meta:
        model = Brand
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
