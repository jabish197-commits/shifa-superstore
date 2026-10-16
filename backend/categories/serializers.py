from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=100,
        validators=[UniqueValidator(
            queryset=Category.objects.all(),
            lookup="iexact",
            message="A category with this name already exists.",
        )],
    )

    class Meta:
        model = Category
        fields = ["id", "name", "description", "image", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
