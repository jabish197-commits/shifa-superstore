from django.contrib import admin

from .models import Offer


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ("title", "discount_percent", "starts_at", "ends_at", "is_active")
    list_filter = ("is_active",)
    search_fields = ("title", "description")
    filter_horizontal = ("products",)
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "title", "description", "products", "discount_percent",
        "starts_at", "ends_at", "is_active", "created_at", "updated_at",
    )
