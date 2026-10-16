import uuid
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from cart.models import Cart, CartItem
from delivery_areas.models import DeliveryArea
from offers.models import Offer
from products.models import Product
from .models import Order
from .services import change_status


class CommerceTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.customer = users.create_user(username="shopper", email="shopper@example.com", password="Safe-password-963!")
        cls.other = users.create_user(username="other", password="Safe-password-724!")
        cls.admin = users.create_superuser(username="commerce_admin", password="Safe-admin-348!")
        cls.product = Product.objects.create(name="Rice", price="100.00", stock=10)
        cls.area = DeliveryArea.objects.create(area_name="Marthandam", pincode="629165")

    def setUp(self):
        cache.clear()
        self.auth(self.customer)
        self.address = {
            "checkout_key": str(uuid.uuid4()), "expected_total": "200.00", "recipient_name": "Test Customer",
            "house_number": "10", "street": "Main Road", "area": "Marthandam", "city": "Marthandam",
            "district": "Kanyakumari", "state": "Tamil Nadu", "pincode": "629165",
            "mobile_number": "9876543210", "payment_method": "COD",
        }

    def auth(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")

    def add(self, product=None, quantity=2):
        response = self.client.post("/api/cart/", {"product_id": (product or self.product).pk, "quantity": quantity}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        return response.data

    def order(self, **changes):
        return self.client.post("/api/orders/", {**self.address, **changes}, format="json")

    def test_cart_is_owned_and_quantities_are_checked(self):
        data = self.add()
        item = data["items"][0]["id"]
        self.assertEqual(data["subtotal"], "200.00")
        self.assertEqual(self.client.patch(f"/api/cart/items/{item}/", {"quantity": 3}).status_code, 200)
        self.assertEqual(self.client.patch(f"/api/cart/items/{item}/", {"quantity": 0}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/cart/items/{item}/", {"quantity": 11}).status_code, 400)
        self.auth(self.other)
        self.client.get("/api/cart/")
        self.assertEqual(self.client.patch(f"/api/cart/items/{item}/", {"quantity": 1}).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/cart/items/{item}/").status_code, 404)
        self.auth(self.customer)
        self.assertEqual(self.client.delete(f"/api/cart/items/{item}/").status_code, 200)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])

    def test_cart_add_is_incremental_and_customer_only(self):
        self.add()
        self.assertEqual(self.add(quantity=1)["items"][0]["quantity"], 3)
        self.auth(self.admin)
        self.assertEqual(self.client.get("/api/cart/").status_code, 403)
        self.assertEqual(self.order().status_code, 403)
        self.client.credentials()
        self.assertEqual(self.client.get("/api/cart/").status_code, 401)

    def test_delivery_check_normalizes_area_and_rejects_wrong_pair(self):
        self.client.credentials()
        response = self.client.post("/api/delivery-areas/check/", {"area": "  MARTHANDAM  ", "pincode": "629165"})
        self.assertTrue(response.data["available"])
        self.assertFalse(self.client.post("/api/delivery-areas/check/", {"area": "Marthandam", "pincode": "629163"}).data["available"])
        self.assertEqual(self.client.post("/api/delivery-areas/check/", {"area": "Marthandam", "pincode": "abc"}).status_code, 400)

    def test_delivery_management_is_admin_only_and_unique(self):
        self.assertEqual(self.client.post("/api/delivery-areas/", {"area_name": "New", "pincode": "629163"}).status_code, 403)
        self.auth(self.admin)
        self.assertEqual(self.client.post("/api/delivery-areas/", {"area_name": " marthandam ", "pincode": "629165"}).status_code, 400)
        response = self.client.post("/api/delivery-areas/", {"area_name": "Kuzhithurai", "pincode": "629163"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.patch(f"/api/delivery-areas/{response.data['id']}/", {"is_active": False}).status_code, 200)

    def test_cod_checkout_updates_stock_clears_cart_and_snapshots(self):
        self.add()
        response = self.order()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["total"], "200.00")
        self.assertEqual(response.data["status"], "Pending")
        self.assertEqual(response.data["payment_method"], "COD")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])
        self.product.name = "Changed"
        self.product.price = Decimal("999.00")
        self.product.save()
        result = self.client.get(f"/api/orders/{response.data['id']}/")
        self.assertEqual(result.data["items"][0]["product_name"], "Rice")
        self.assertEqual(result.data["items"][0]["unit_price"], "100.00")
        self.product.delete()
        result = self.client.get(f"/api/orders/{response.data['id']}/")
        self.assertIsNone(result.data["items"][0]["product"])
        self.assertEqual(result.data["total"], "200.00")

    def test_duplicate_submission_returns_existing_order(self):
        self.add()
        first = self.order()
        second = self.order()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Order.objects.count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

    def test_other_customer_cannot_read_or_change_order(self):
        self.add()
        order = self.order().data
        self.auth(self.other)
        self.assertEqual(self.client.get(f"/api/orders/{order['id']}/").status_code, 404)
        self.assertEqual(self.client.get("/api/orders/").data["count"], 0)
        self.assertEqual(self.client.patch(f"/api/orders/{order['id']}/status/", {"status": "Cancelled"}).status_code, 403)
        self.auth(self.admin)
        self.assertEqual(self.client.get(f"/api/orders/{order['id']}/").status_code, 200)

    def test_backend_rechecks_delivery_and_leaves_cart_untouched(self):
        self.add()
        self.area.is_active = False
        self.area.save()
        self.assertEqual(self.order().status_code, 400)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(self.client.get("/api/cart/").data["item_count"], 2)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

    def test_stock_shortage_rolls_back_entire_order(self):
        self.add()
        second = Product.objects.create(name="Milk", price="20.00", stock=2)
        self.add(second, 2)
        second.stock = 1
        second.save()
        self.assertEqual(self.order(expected_total="240.00").status_code, 400)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(CartItem.objects.count(), 2)

    def test_rechecks_product_and_parent_availability(self):
        self.add()
        self.product.is_active = False
        self.product.save()
        self.assertFalse(self.client.get("/api/cart/").data["can_checkout"])
        self.assertEqual(self.order().status_code, 400)

    def test_server_recalculates_offer_and_requires_new_total_confirmation(self):
        self.add()
        offer = Offer.objects.create(title="Ten off", discount_percent="10.00", starts_at=timezone.now()-timedelta(hours=1), ends_at=timezone.now()+timedelta(hours=1))
        offer.products.add(self.product)
        self.assertEqual(self.order().status_code, 400)
        self.assertEqual(self.client.get("/api/cart/").data["total"], "180.00")
        result = self.order(expected_total="180.00", total="1.00")
        self.assertEqual(result.status_code, 201)
        self.assertEqual(result.data["total"], "180.00")

    def test_empty_cart_invalid_address_and_online_payment_rejected(self):
        self.assertEqual(self.order().status_code, 400)
        self.add()
        for changes in ({"payment_method": "CARD"}, {"pincode": "123"}, {"mobile_number": "123"}, {"street": ""}, {"expected_total": "1.00"}):
            self.assertEqual(self.order(**changes).status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_cancellation_restores_stock_once_and_is_terminal(self):
        self.add()
        order = self.order().data
        self.auth(self.admin)
        url = f"/api/orders/{order['id']}/status/"
        self.assertEqual(self.client.patch(url, {"status": "Cancelled"}).status_code, 200)
        self.assertEqual(self.client.patch(url, {"status": "Cancelled"}).status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)
        self.assertEqual(self.client.patch(url, {"status": "Confirmed"}).status_code, 400)

    def test_order_progression_and_dashboard(self):
        self.add()
        order = self.order().data
        self.assertEqual(self.client.get("/api/admin/dashboard/").status_code, 403)
        self.auth(self.admin)
        url = f"/api/orders/{order['id']}/status/"
        self.assertEqual(self.client.patch(url, {"status": "Delivered"}).status_code, 400)
        for state in ("Confirmed", "Packed", "Shipped", "Delivered"):
            self.assertEqual(self.client.patch(url, {"status": state}).status_code, 200)
        self.assertEqual(self.client.patch(url, {"status": "Cancelled"}).status_code, 400)
        dashboard = self.client.get("/api/admin/dashboard/").data
        self.assertEqual(dashboard["delivered_orders"], 1)
        self.assertEqual(Decimal(dashboard["delivered_revenue"]), Decimal("200.00"))
