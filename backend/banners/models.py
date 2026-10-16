from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models


def validate_banner_image_size(image):
    if image.size > 5 * 1024 * 1024:
        raise ValidationError("Banner images must be 5 MB or smaller.")


class Banner(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    alt_text = models.CharField(max_length=200)
    image = models.ImageField(
        upload_to="banners/",
        validators=[
            FileExtensionValidator(["jpg", "jpeg", "png", "webp"]),
            validate_banner_image_size,
        ],
    )
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(display_order__gte=0),
                name="banners_display_order_nonnegative",
            ),
        ]

    def __str__(self):
        return self.title
