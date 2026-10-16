from rest_framework import serializers
from .models import DeliveryArea, normalize_area, pincode_validator


class DeliveryAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryArea
        fields = ["id", "area_name", "pincode", "is_active"]

    def validate(self, attrs):
        area = attrs.get("area_name", getattr(self.instance, "area_name", ""))
        pincode = attrs.get("pincode", getattr(self.instance, "pincode", ""))
        matches = DeliveryArea.objects.filter(area_key=normalize_area(area), pincode=pincode)
        if self.instance:
            matches = matches.exclude(pk=self.instance.pk)
        if matches.exists():
            raise serializers.ValidationError("This area and pincode combination already exists.")
        return attrs


class DeliveryCheckSerializer(serializers.Serializer):
    area = serializers.CharField(max_length=120)
    pincode = serializers.CharField(max_length=6, validators=[pincode_validator])
