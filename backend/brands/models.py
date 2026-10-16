from django.db import models
from django.db.models.functions import Lower


class Brand(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]
        verbose_name_plural = "brands"
        constraints = [
            models.UniqueConstraint(Lower("name"), name="brands_name_unique_lower"),
        ]

    def __str__(self):
        return self.name
