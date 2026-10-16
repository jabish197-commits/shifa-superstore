from decimal import Decimal
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from cart.models import Cart
from delivery_areas.models import DeliveryArea, normalize_area
from offers.services import get_product_pricing
from products.models import Product
from .models import Order, OrderItem

TRANSITIONS = {
    "Pending": ["Confirmed", "Cancelled"],
    "Confirmed": ["Packed", "Cancelled"],
    "Packed": ["Shipped", "Cancelled"],
    "Shipped": ["Delivered"],
    "Delivered": [],
    "Cancelled": [],
}


@transaction.atomic
def place_order(user, data):
    cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
    previous = Order.objects.filter(user=user, checkout_key=data["checkout_key"]).first()
    if previous:
        return previous, False
    area = DeliveryArea.objects.select_for_update().filter(
        area_key=normalize_area(data["area"]), pincode=data["pincode"], is_active=True,
    ).first()
    if not area:
        raise ValidationError({"area": "Sorry, we currently don't deliver to this area."})
    items = list(cart.items.order_by("product_id"))
    if not items:
        raise ValidationError("Cart is empty.")
    products = {
        product.pk: product for product in Product.objects.select_for_update(of=("self",))
        .filter(pk__in=[item.product_id for item in items]).select_related("category", "brand")
        .prefetch_related("offers").order_by("pk")
    }
    now = timezone.now()
    total = Decimal("0.00")
    lines = []
    for item in items:
        product = products.get(item.product_id)
        if product is None or not product.in_stock or item.quantity > product.stock:
            raise ValidationError("A product is unavailable or has insufficient stock. Please review your cart.")
        pricing = get_product_pricing(product, at=now)
        total += pricing["final_price"] * item.quantity
        lines.append((item, product, pricing["final_price"]))
    if total != data["expected_total"]:
        raise ValidationError({"expected_total": "Prices have changed. Refresh your cart and confirm the new total."})
    address = {key: value for key, value in data.items() if key not in ("expected_total", "payment_method")}
    address["area"] = area.area_name
    order = Order.objects.create(user=user, payment_method="COD", total=total, **address)
    for item, product, unit_price in lines:
        changed = Product.objects.filter(pk=product.pk, stock__gte=item.quantity).update(stock=F("stock") - item.quantity)
        if changed != 1:
            raise ValidationError("Product is out of stock. Please review your cart.")
        OrderItem.objects.create(
            order=order, product=product, product_name=product.name, quantity=item.quantity,
            original_price=product.price, unit_price=unit_price,
        )
    cart.items.all().delete()
    return order, True


@transaction.atomic
def change_status(order_id, new_status):
    order = Order.objects.select_for_update().get(pk=order_id)
    if new_status == order.status:
        return order
    if new_status not in TRANSITIONS[order.status]:
        raise ValidationError({"status": f"Cannot change {order.status} to {new_status}."})
    if new_status == Order.Status.CANCELLED:
        for item in order.items.order_by("product_id"):
            if item.product_id:
                Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order
