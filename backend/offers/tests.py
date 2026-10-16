from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from brands.models import Brand
from categories.models import Category
from products.models import Product
from .models import Offer
from .services import get_product_pricing


class OfferTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.admin = users.create_superuser(username="offer_admin", password="Test-Admin-976!")
        cls.customer = users.create_user(username="offer_customer", password="Test-Buyer-418!")
        cls.now = timezone.now()
        cls.rice = Product.objects.create(name="Rice", price="65.00", stock=10)
        cls.hidden = Product.objects.create(name="Hidden", price="20.00", stock=3, is_active=False)
        cls.offer = Offer.objects.create(
            title="Rice sale", discount_percent="10.00",
            starts_at=cls.now - timedelta(days=1), ends_at=cls.now + timedelta(days=1),
        )
        cls.offer.products.add(cls.rice, cls.hidden)

    def setUp(self):
        self.list_url = reverse("offer-list")
        self.detail_url = reverse("offer-detail", args=[self.offer.pk])
        self.product_url = reverse("product-detail", args=[self.rice.pk])

    def authenticate(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")

    def make_offer(self, **changes):
        values = {
            "title": "Another sale", "discount_percent": "20.00",
            "starts_at": self.now - timedelta(hours=1),
            "ends_at": self.now + timedelta(hours=1),
        }
        values.update(changes)
        offer = Offer.objects.create(**values)
        offer.products.add(self.rice)
        return offer

    def test_public_offer_hides_unavailable_product_ids(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["products"], [self.rice.pk])
        response = self.client.get(self.detail_url)
        self.assertEqual(response.data["products"], [self.rice.pk])

    def test_public_hides_inactive_future_expired_and_empty_offers(self):
        hidden_offers = [
            self.make_offer(is_active=False),
            self.make_offer(starts_at=self.now + timedelta(hours=1), ends_at=self.now + timedelta(hours=2)),
            self.make_offer(starts_at=self.now - timedelta(hours=2), ends_at=self.now - timedelta(hours=1)),
            self.make_offer(),
        ]
        hidden_offers[-1].products.clear()
        self.assertEqual(len(self.client.get(self.list_url).data), 1)
        for offer in hidden_offers:
            with self.subTest(offer=offer.pk):
                self.assertEqual(self.client.get(reverse("offer-detail", args=[offer.pk])).status_code, 404)
        self.authenticate(self.admin)
        self.assertEqual(len(self.client.get(self.list_url).data), 5)

    def test_offer_disappears_when_all_products_are_hidden(self):
        self.rice.is_active = False
        self.rice.save(update_fields=["is_active"])
        self.assertEqual(self.client.get(self.list_url).data, [])
        self.assertEqual(self.client.get(self.detail_url).status_code, 404)

    def test_anonymous_and_customer_cannot_write(self):
        for user, expected in ((None, 401), (self.customer, 403)):
            if user:
                self.authenticate(user)
            for method, url, data in (
                ("post", self.list_url, {}), ("put", self.detail_url, {}),
                ("patch", self.detail_url, {"discount_percent": "90"}),
                ("delete", self.detail_url, {}),
            ):
                with self.subTest(user=user, method=method):
                    response = getattr(self.client, method)(url, data, format="json")
                    self.assertEqual(response.status_code, expected)

    def test_admin_can_create_update_and_delete(self):
        self.authenticate(self.admin)
        response = self.client.post(self.list_url, {
            "title": "New offer", "products": [self.rice.pk], "discount_percent": "15.00",
            "ends_at": (self.now + timedelta(days=2)).isoformat(),
        }, format="json")
        self.assertEqual(response.status_code, 201)
        url = reverse("offer-detail", args=[response.data["id"]])
        self.assertEqual(self.client.patch(url, {"is_active": False}).status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertTrue(Product.objects.filter(pk=self.rice.pk).exists())

    def test_invalid_input_is_rejected(self):
        self.authenticate(self.admin)
        body = {
            "title": "Test", "products": [self.rice.pk], "discount_percent": "15.00",
            "starts_at": self.now.isoformat(),
            "ends_at": (self.now + timedelta(days=1)).isoformat(),
        }
        for changes in (
            {"title": " "}, {"discount_percent": "0"}, {"discount_percent": "100"},
            {"discount_percent": "-1"}, {"discount_percent": "1.999"},
            {"ends_at": self.now.isoformat()}, {"products": []}, {"products": [999999]},
        ):
            with self.subTest(changes=changes):
                self.assertEqual(self.client.post(self.list_url, {**body, **changes}, format="json").status_code, 400)

    def test_partial_update_validates_dates_against_existing_values(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.patch(self.detail_url, {
            "ends_at": (self.offer.starts_at - timedelta(seconds=1)).isoformat(),
        }).status_code, 400)
        self.assertEqual(self.client.patch(self.detail_url, {
            "starts_at": (self.offer.ends_at + timedelta(seconds=1)).isoformat(),
        }).status_code, 400)

    def test_database_constraints(self):
        for changes in ({"discount_percent": 0}, {"discount_percent": 100}, {"ends_at": self.offer.starts_at}):
            with self.subTest(changes=changes):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    Offer.objects.filter(pk=self.offer.pk).update(**changes)

    def test_model_date_validation_for_admin(self):
        self.offer.ends_at = self.offer.starts_at
        with self.assertRaises(ValidationError):
            self.offer.full_clean()

    def test_discount_uses_decimal_and_keeps_original_price(self):
        response = self.client.get(self.product_url)
        self.assertEqual(response.data["price"], "65.00")
        self.assertEqual(response.data["pricing"]["final_price"], "58.50")
        self.assertEqual(response.data["pricing"]["discount_amount"], "6.50")
        self.assertEqual(response.data["pricing"]["offer"]["id"], self.offer.pk)
        self.rice.refresh_from_db()
        self.assertEqual(self.rice.price, Decimal("65.00"))

    def test_highest_discount_wins_without_stacking(self):
        best = self.make_offer(discount_percent="20.00")
        self.make_offer(discount_percent="20.00")
        result = get_product_pricing(self.rice, at=self.now)
        self.assertEqual(result["offer"].pk, best.pk)
        self.assertEqual(result["final_price"], Decimal("52.00"))

    def test_offer_window_includes_start_and_excludes_end(self):
        self.assertIsNotNone(get_product_pricing(self.rice, at=self.offer.starts_at)["offer"])
        self.assertIsNone(get_product_pricing(self.rice, at=self.offer.starts_at - timedelta(microseconds=1))["offer"])
        self.assertIsNone(get_product_pricing(self.rice, at=self.offer.ends_at)["offer"])

    def test_rounding_and_minimum_one_cent(self):
        self.rice.price = Decimal("0.15")
        self.assertEqual(get_product_pricing(self.rice, at=self.now)["final_price"], Decimal("0.14"))
        self.make_offer(discount_percent="99.00")
        self.rice.price = Decimal("0.01")
        self.assertEqual(get_product_pricing(self.rice, at=self.now)["final_price"], Decimal("0.01"))

    def test_deactivation_and_removal_restore_regular_price(self):
        self.authenticate(self.admin)
        self.client.patch(self.detail_url, {"is_active": False})
        self.assertEqual(self.client.get(self.product_url).data["pricing"]["final_price"], "65.00")
        self.client.patch(self.detail_url, {"is_active": True, "products": [self.hidden.pk]}, format="json")
        self.assertIsNone(self.client.get(self.product_url).data["pricing"]["offer"])

    def test_category_and_brand_status_hide_offers_and_disable_discount(self):
        category = Category.objects.create(name="Sale category", is_active=False)
        brand = Brand.objects.create(name="Sale brand", is_active=False)
        for field, parent in (("category", category), ("brand", brand)):
            with self.subTest(field=field):
                setattr(self.rice, field, parent)
                self.rice.save(update_fields=[field])
                self.assertIsNone(get_product_pricing(self.rice, at=self.now)["offer"])
                self.assertEqual(self.client.get(self.list_url).data, [])
                setattr(self.rice, field, None)
                self.rice.save(update_fields=[field])

    def test_pricing_is_read_only(self):
        self.authenticate(self.admin)
        response = self.client.patch(self.product_url, {"pricing": {"final_price": "1.00"}}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["pricing"]["final_price"], "58.50")

    def test_product_list_prefetches_offers(self):
        Product.objects.bulk_create([Product(name=f"Extra {index}", price="10") for index in range(5)])
        with self.assertNumQueries(3):
            response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, 200)

    def test_missing_offer_and_search(self):
        self.assertEqual(self.client.get(reverse("offer-detail", args=[999999])).status_code, 404)
        self.assertEqual(len(self.client.get(self.list_url, {"search": "rice"}).data), 1)
        self.assertEqual(self.client.get(self.list_url, {"search": "missing"}).data, [])

    def test_admin_offer_form(self):
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(reverse("admin:offers_offer_add")).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:offers_offer_change", args=[self.offer.pk])).status_code, 200)
