from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        PACKED = "Packed", "Packed"
        SHIPPED = "Shipped", "Shipped"
        DELIVERED = "Delivered", "Delivered"
        CANCELLED = "Cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    checkout_key = models.UUIDField()
    recipient_name = models.CharField(max_length=120)
    house_number = models.CharField(max_length=100)
    street = models.CharField(max_length=200)
    area = models.CharField(max_length=120)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    mobile_number = models.CharField(max_length=10)
    payment_method = models.CharField(max_length=3, default="COD", editable=False)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(fields=["user", "checkout_key"], name="order_checkout_unique"),
            models.CheckConstraint(condition=models.Q(payment_method="COD"), name="order_cod_only"),
            models.CheckConstraint(condition=models.Q(total__gte=0), name="order_total_nonnegative"),
            models.CheckConstraint(condition=models.Q(status__in=["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]), name="order_status_valid"),
        ]

    @property
    def number(self):
        return f"SHIFA-{self.pk:06d}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.SET_NULL, null=True, related_name="order_items")
    product_name = models.CharField(max_length=200)
    quantity = models.PositiveSmallIntegerField()
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gte=1, quantity__lte=99), name="order_item_quantity_valid"),
            models.CheckConstraint(condition=models.Q(unit_price__gte=0), name="order_item_price_nonnegative"),
        ]

    @property
    def line_total(self):
        return self.unit_price * self.quantity
