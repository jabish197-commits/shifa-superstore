from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "original_price", "unit_price")
    can_delete = False
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total", "area", "pincode", "created_at")
    list_filter = ("status",)
    search_fields = ("user__username", "recipient_name", "mobile_number")
    readonly_fields = tuple(field.name for field in Order._meta.fields)
    inlines = [OrderItemInline]
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False
