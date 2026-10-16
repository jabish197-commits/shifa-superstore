from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase
from products.models import Product
from offers.models import Offer

class OfferFilterTests(APITestCase):
    def test_offer_filter_only_returns_active_offer_products(self):
        p = Product.objects.create(name="Included", price="50", stock=4)
        Product.objects.create(name="Excluded", price="20", stock=4)
        offer = Offer.objects.create(title="Current", discount_percent="10", starts_at=timezone.now()-timedelta(days=1), ends_at=timezone.now()+timedelta(days=1))
        offer.products.add(p)
        response = self.client.get(f"/api/products/?offer={offer.pk}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.data["results"]], [p.pk])
        offer.is_active = False
        offer.save()
        self.assertEqual(self.client.get(f"/api/products/?offer={offer.pk}").data["count"], 0)
        self.assertEqual(self.client.get("/api/products/?offer=bad").status_code, 400)
