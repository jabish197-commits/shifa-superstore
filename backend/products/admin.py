from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "brand", "price", "stock", "is_active", "updated_at")
    list_filter = ("is_active", "category", "brand")
    list_select_related = ("category", "brand")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "name", "description", "category", "brand", "price", "stock", "image", "is_active",
        "created_at", "updated_at",
    )
