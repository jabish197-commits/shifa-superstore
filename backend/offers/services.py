from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone


def get_product_pricing(product, at=None):
    at = at if at is not None else timezone.now()
    price = Decimal(product.price)
    result = {"final_price": price, "discount_amount": Decimal("0.00"), "offer": None}
    if not product.is_active:
        return result
    if product.category_id and not product.category.is_active:
        return result
    if product.brand_id and not product.brand.is_active:
        return result

    valid_offers = [
        offer for offer in product.offers.all()
        if offer.is_active and offer.starts_at <= at < offer.ends_at
    ]
    if not valid_offers:
        return result
    offer = min(valid_offers, key=lambda item: (-item.discount_percent, item.pk))
    final_price = max(
        Decimal("0.01"),
        (price * (1 - offer.discount_percent / Decimal("100"))).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP,
        ),
    )
    return {
        "final_price": final_price,
        "discount_amount": price - final_price,
        "offer": offer,
    }
