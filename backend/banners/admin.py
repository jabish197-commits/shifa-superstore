from django.contrib import admin

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "display_order", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle", "alt_text")
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "title", "subtitle", "alt_text", "image", "display_order",
        "is_active", "created_at", "updated_at",
    )
