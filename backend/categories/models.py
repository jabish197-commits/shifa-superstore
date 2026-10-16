from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models.functions import Lower


def validate_category_image_size(image):
    if image.size > 5 * 1024 * 1024:
        raise ValidationError("Category images must be 5 MB or smaller.")


class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"]), validate_category_image_size])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]
        verbose_name_plural = "categories"
        constraints = [
            models.UniqueConstraint(Lower("name"), name="categories_name_unique_lower"),
        ]

    def __str__(self):
        return self.name
