import unicodedata
from django.core.validators import RegexValidator
from django.db import models

pincode_validator = RegexValidator(r"^[1-9][0-9]{5}$", "Enter a valid six-digit pincode.")


def normalize_area(value):
    return " ".join(unicodedata.normalize("NFKC", value).split()).casefold()


class DeliveryArea(models.Model):
    area_name = models.CharField(max_length=120)
    area_key = models.CharField(max_length=240, editable=False)
    pincode = models.CharField(max_length=6, validators=[pincode_validator])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["area_name", "pincode"]
        constraints = [models.UniqueConstraint(fields=["area_key", "pincode"], name="delivery_area_pincode_unique")]

    def save(self, *args, **kwargs):
        self.area_name = " ".join(self.area_name.split())
        self.area_key = normalize_area(self.area_name)
        if kwargs.get("update_fields"):
            kwargs["update_fields"] = set(kwargs["update_fields"]) | {"area_name", "area_key"}
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.area_name} — {self.pincode}"
