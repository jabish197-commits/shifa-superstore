from decimal import Decimal
from io import BytesIO
from tempfile import TemporaryDirectory

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Product


class ProductTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.admin = users.create_superuser(username="product_admin", password="Test-Admin-924!")
        cls.customer = users.create_user(username="buyer", password="Test-Buyer-763!")
        cls.rice = Product.objects.create(name="Rice 1 kg", price="65.00", stock=20)
        cls.milk = Product.objects.create(name="Milk 500 ml", price="30.00", stock=0)
        cls.hidden = Product.objects.create(
            name="Hidden product", price="10.00", stock=4, is_active=False,
        )

    def setUp(self):
        self.list_url = reverse("product-list")
        self.detail_url = reverse("product-detail", args=[self.rice.pk])

    def authenticate(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")

    def test_public_list_only_shows_active_products(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual({item["id"] for item in response.data["results"]}, {
            self.rice.pk, self.milk.pk,
        })

    def test_inactive_detail_is_hidden_from_public_and_customer(self):
        url = reverse("product-detail", args=[self.hidden.pk])
        self.assertEqual(self.client.get(url).status_code, 404)
        self.authenticate(self.customer)
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_missing_product_returns_404(self):
        self.assertEqual(self.client.get(reverse("product-detail", args=[999999])).status_code, 404)

    def test_search_price_stock_and_ordering(self):
        response = self.client.get(self.list_url, {
            "search": "rice", "min_price": "50.00", "max_price": "70.00", "in_stock": "true",
        })
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.rice.pk)
        response = self.client.get(self.list_url, {"ordering": "price"})
        self.assertEqual([item["id"] for item in response.data["results"]], [self.milk.pk, self.rice.pk])
        response = self.client.get(self.list_url, {"in_stock": "false"})
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.milk.pk)
        self.assertFalse(response.data["results"][0]["in_stock"])

    def test_invalid_filters_return_400(self):
        for query in (
            {"min_price": "abc"}, {"min_price": "-1"},
            {"min_price": "80", "max_price": "20"}, {"in_stock": "invalid"},
        ):
            with self.subTest(query=query):
                self.assertEqual(self.client.get(self.list_url, query).status_code, 400)

    def test_list_is_paginated(self):
        Product.objects.bulk_create([
            Product(name=f"Product {index}", price="5.00") for index in range(15)
        ])
        response = self.client.get(self.list_url)
        self.assertEqual(response.data["count"], 17)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertIsNotNone(response.data["next"])
        self.assertEqual(len(self.client.get(self.list_url, {"page": 2}).data["results"]), 5)

    def test_anonymous_and_customer_cannot_write(self):
        for user, expected in ((None, 401), (self.customer, 403)):
            if user:
                self.authenticate(user)
            for method, url, body in (
                ("post", self.list_url, {"name": "Blocked", "price": "2.00"}),
                ("put", self.detail_url, {"name": "Blocked", "price": "2.00"}),
                ("patch", self.detail_url, {"stock": 999}),
                ("delete", self.detail_url, {}),
            ):
                with self.subTest(user=user, method=method):
                    self.assertEqual(getattr(self.client, method)(url, body, format="json").status_code, expected)
        self.rice.refresh_from_db()
        self.assertEqual(self.rice.stock, 20)

    def test_admin_can_manage_products_with_jwt(self):
        self.authenticate(self.admin)
        response = self.client.post(self.list_url, {
            "name": "Bread", "price": "45.50", "stock": 8,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        url = reverse("product-detail", args=[response.data["id"]])
        response = self.client.patch(url, {"stock": 0, "is_active": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["in_stock"])
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.get(self.list_url).data["count"], 4)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Product.objects.filter(pk=response.data["id"]).exists())

    def test_inactive_admin_token_is_rejected(self):
        self.authenticate(self.admin)
        self.admin.is_active = False
        self.admin.save(update_fields=["is_active"])
        response = self.client.post(self.list_url, {"name": "Blocked", "price": "1.00"})
        self.assertEqual(response.status_code, 401)

    def test_invalid_fields_are_rejected(self):
        self.authenticate(self.admin)
        for changes in (
            {"price": "0"}, {"price": "-1"}, {"price": "1.999"},
            {"stock": -1}, {"stock": 1.5}, {"name": "   "},
        ):
            with self.subTest(changes=changes):
                response = self.client.post(self.list_url, {
                    "name": "Test", "price": "5.00", "stock": 1, **changes,
                }, format="json")
                self.assertEqual(response.status_code, 400)

    def test_database_rejects_negative_stock_and_nonpositive_price(self):
        for values in ({"stock": -1}, {"price": Decimal("0.00")}):
            with self.subTest(values=values):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    Product.objects.filter(pk=self.rice.pk).update(**values)

    def test_valid_image_upload(self):
        self.authenticate(self.admin)
        buffer = BytesIO()
        Image.new("RGB", (10, 10), "green").save(buffer, format="PNG")
        image = SimpleUploadedFile("rice.png", buffer.getvalue(), content_type="image/png")
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            response = self.client.patch(self.detail_url, {"image": image}, format="multipart")
            self.assertEqual(response.status_code, 200)
            self.assertIn("/media/products/", response.data["image"])
            self.rice.refresh_from_db()
            self.assertTrue(self.rice.image.storage.exists(self.rice.image.name))

    def test_invalid_image_upload(self):
        self.authenticate(self.admin)
        image = SimpleUploadedFile("fake.png", b"not an image", content_type="image/png")
        response = self.client.patch(self.detail_url, {"image": image}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)

    def test_large_image_and_disallowed_extension_are_rejected(self):
        self.authenticate(self.admin)
        for filename, image_format, padding in (
            ("large.png", "PNG", b"0" * (5 * 1024 * 1024)),
            ("image.gif", "GIF", b""),
        ):
            with self.subTest(filename=filename):
                buffer = BytesIO()
                Image.new("RGB", (10, 10), "green").save(buffer, format=image_format)
                image = SimpleUploadedFile(filename, buffer.getvalue() + padding)
                response = self.client.patch(self.detail_url, {"image": image}, format="multipart")
                self.assertEqual(response.status_code, 400)
                self.assertIn("image", response.data)

    def test_django_admin_product_form_is_available(self):
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(reverse("admin:products_product_add")).status_code, 200)
