from rest_framework.permissions import BasePermission

from .models import User


class IsAdmin(BasePermission):
    message = "You are not authorized."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role == User.Role.ADMIN
        )


class IsCustomer(BasePermission):
    message = "You are not authorized."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role == User.Role.CUSTOMER
        )
