from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        CUSTOMER = "customer", "Customer"

    role = models.CharField(
        max_length=8,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    objects = UserManager()

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(role="admin", is_staff=True, is_superuser=True)
                    | models.Q(role="customer", is_staff=False, is_superuser=False)
                ),
                name="accounts_user_role_matches_permissions",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.role not in self.Role.values:
            raise ValidationError({"role": "Choose Admin or Customer."})
        self.is_staff = self.role == self.Role.ADMIN
        self.is_superuser = self.role == self.Role.ADMIN
        if kwargs.get("update_fields") is not None:
            if not kwargs["update_fields"]:
                return
            kwargs["update_fields"] = set(kwargs["update_fields"]) | {
                "role", "is_staff", "is_superuser",
            }
        super().save(*args, **kwargs)
