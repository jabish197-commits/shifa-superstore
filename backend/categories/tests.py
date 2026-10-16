from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from products.models import Product
from .models import Category


class CategoryTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.admin = users.create_superuser(username="category_admin", password="Test-Admin-743!")
        cls.customer = users.create_user(username="category_buyer", password="Test-Buyer-938!")
        cls.grocery = Category.objects.create(name="Groceries")
        cls.hidden = Category.objects.create(name="Hidden", is_active=False)
        cls.rice = Product.objects.create(name="Rice", category=cls.grocery, price="65.00", stock=10)
        cls.hidden_product = Product.objects.create(name="Hidden rice", category=cls.hidden, price="50.00", stock=3)
        cls.uncategorized = Product.objects.create(name="Uncategorized", price="20.00", stock=2)

    def setUp(self):
        self.list_url = reverse("category-list")
        self.detail_url = reverse("category-detail", args=[self.grocery.pk])
        self.product_url = reverse("product-detail", args=[self.rice.pk])

    def authenticate(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")

    def test_public_categories_hide_inactive(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.grocery.pk])
        self.assertEqual(self.client.get(reverse("category-detail", args=[self.hidden.pk])).status_code, 404)
        self.assertEqual(self.client.get(reverse("category-detail", args=[999999])).status_code, 404)

    def test_search_categories(self):
        self.assertEqual(len(self.client.get(self.list_url, {"search": "groc"}).data), 1)
        self.assertEqual(self.client.get(self.list_url, {"search": "missing"}).data, [])

    def test_anonymous_and_customer_cannot_change_categories(self):
        for user, expected in ((None, 401), (self.customer, 403)):
            if user:
                self.authenticate(user)
            for method, url, body in (
                ("post", self.list_url, {"name": "Blocked"}),
                ("put", self.detail_url, {"name": "Blocked"}),
                ("patch", self.detail_url, {"is_active": False}),
                ("delete", self.detail_url, {}),
            ):
                with self.subTest(user=user, method=method):
                    response = getattr(self.client, method)(url, body, format="json")
                    self.assertEqual(response.status_code, expected)

    def test_admin_can_create_edit_and_delete_empty_category(self):
        self.authenticate(self.admin)
        response = self.client.post(self.list_url, {"name": "Dairy"}, format="json")
        self.assertEqual(response.status_code, 201)
        url = reverse("category-detail", args=[response.data["id"]])
        self.assertEqual(self.client.patch(url, {"name": "Milk products", "is_active": False}).status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(len(self.client.get(self.list_url).data), 3)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_category_names_are_trimmed_unique_and_nonblank(self):
        self.authenticate(self.admin)
        for name in ("groceries", "  GROCERIES  ", "   "):
            with self.subTest(name=name):
                response = self.client.post(self.list_url, {"name": name})
                self.assertEqual(response.status_code, 400)
                self.assertIn("name", response.data)
        response = self.client.patch(self.detail_url, {"name": "Groceries"})
        self.assertEqual(response.status_code, 200)
        response = self.client.post(self.list_url, {"name": "  Dairy  "})
        self.assertEqual(response.data["name"], "Dairy")

    def test_database_rejects_case_duplicate(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Category.objects.create(name="GROCERIES")

    def test_product_category_fields_and_filter(self):
        response = self.client.get(reverse("product-list"), {"category": self.grocery.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        product = response.data["results"][0]
        self.assertEqual(product["category"], self.grocery.pk)
        self.assertEqual(product["category_name"], "Groceries")
        self.assertEqual(self.client.get(reverse("product-list"), {"category": "bad"}).status_code, 400)
        self.assertEqual(self.client.get(reverse("product-list"), {"category": 999999}).data["count"], 0)

    def test_uncategorized_products_remain_visible(self):
        response = self.client.get(reverse("product-detail", args=[self.uncategorized.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["category"])
        self.assertIsNone(response.data["category_name"])
        self.assertTrue(response.data["in_stock"])

    def test_deactivation_hides_products_and_reactivation_restores_them(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.patch(self.detail_url, {"is_active": False}).status_code, 200)
        self.client.credentials()
        self.assertEqual(self.client.get(self.product_url).status_code, 404)
        self.assertEqual(self.client.get(reverse("product-list"), {"category": self.grocery.pk}).data["count"], 0)
        self.authenticate(self.customer)
        self.assertEqual(self.client.get(self.product_url).status_code, 404)
        self.authenticate(self.admin)
        response = self.client.get(self.product_url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["in_stock"])
        self.assertEqual(self.client.patch(self.detail_url, {"is_active": True}).status_code, 200)
        self.client.credentials()
        self.assertEqual(self.client.get(self.product_url).status_code, 200)

    def test_admin_stock_filter_accounts_for_category_status(self):
        self.authenticate(self.admin)
        response = self.client.get(reverse("product-list"), {"in_stock": "true"})
        self.assertEqual({item["id"] for item in response.data["results"]}, {self.rice.pk, self.uncategorized.pk})
        response = self.client.get(reverse("product-list"), {"in_stock": "false"})
        self.assertEqual([item["id"] for item in response.data["results"]], [self.hidden_product.pk])

    def test_admin_can_assign_and_clear_category(self):
        self.authenticate(self.admin)
        response = self.client.patch(self.product_url, {"category": self.hidden.pk}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["in_stock"])
        response = self.client.patch(self.product_url, {"category": None}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["category_name"])
        self.assertTrue(response.data["in_stock"])
        self.assertEqual(self.client.patch(self.product_url, {"category": 999999}).status_code, 400)

    def test_delete_category_with_products_returns_conflict(self):
        self.authenticate(self.admin)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, 409)
        self.assertIn("Reassign", response.data["detail"])
        self.assertTrue(Product.objects.filter(pk=self.rice.pk).exists())
        self.client.patch(self.product_url, {"category": None}, format="json")
        self.assertEqual(self.client.delete(self.detail_url).status_code, 204)

    def test_database_relationship_protects_products(self):
        with self.assertRaises(ProtectedError):
            self.grocery.delete()
        self.assertTrue(Product.objects.filter(pk=self.rice.pk).exists())

    def test_django_admin_forms_and_duplicate_validation(self):
        self.client.force_login(self.admin)
        url = reverse("admin:categories_category_add")
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:products_product_change", args=[self.rice.pk])).status_code, 200)
        response = self.client.post(url, {"name": "GROCERIES", "description": "", "is_active": "on"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context["adminform"].form.errors)
