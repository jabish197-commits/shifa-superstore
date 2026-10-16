from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email")
    ordering = ("username",)
    readonly_fields = ("last_login", "date_joined")
    filter_horizontal = ()
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal information", {"fields": ("first_name", "last_name", "email")}),
        ("Store access", {"fields": ("role", "is_active")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "role", "password1", "password2"),
        }),
    )


admin.site.unregister(Group)
admin.site.site_header = "Shifa Superstore Administration"
admin.site.site_title = "Shifa Superstore Admin"
admin.site.index_title = "Store management"
