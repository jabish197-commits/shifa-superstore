from django.contrib import admin
from django import forms
from .models import DeliveryArea
from .serializers import DeliveryAreaSerializer


class DeliveryAreaForm(forms.ModelForm):
    class Meta:
        model = DeliveryArea
        fields = ["area_name", "pincode", "is_active"]

    def clean(self):
        data = super().clean()
        if "area_name" in data and "pincode" in data:
            serializer = DeliveryAreaSerializer(instance=self.instance if self.instance.pk else None, data=data)
            if not serializer.is_valid():
                raise forms.ValidationError("Check the area and pincode; this combination may already exist.")
        return data


@admin.register(DeliveryArea)
class DeliveryAreaAdmin(admin.ModelAdmin):
    form = DeliveryAreaForm
    list_display = ("area_name", "pincode", "is_active")
    list_filter = ("is_active",)
    search_fields = ("area_name", "pincode")
