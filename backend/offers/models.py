from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Offer(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    products = models.ManyToManyField("products.Product", related_name="offers")
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01")),
            MaxValueValidator(Decimal("99.00")),
        ],
    )
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-discount_percent", "id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(discount_percent__gte=Decimal("0.01"))
                & models.Q(discount_percent__lte=Decimal("99.00")),
                name="offers_discount_valid_range",
            ),
            models.CheckConstraint(
                condition=models.Q(ends_at__gt=models.F("starts_at")),
                name="offers_end_after_start",
            ),
        ]

    def clean(self):
        super().clean()
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError({"ends_at": "End time must be after start time."})

    def __str__(self):
        return self.title
