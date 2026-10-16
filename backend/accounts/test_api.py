from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase


class AuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.payload = {"username": "new_customer", "email": "customer@example.com", "password": "Unique-Shop-Password-847!"}

    def test_registration_login_refresh_logout(self):
        response = self.client.post("/api/accounts/register/", self.payload)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["role"], "customer")
        self.assertNotIn("password", response.data)
        response = self.client.post("/api/accounts/login/", {"username": self.payload["username"], "password": self.payload["password"]})
        self.assertEqual(response.status_code, 200)
        token = response.data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token['access']}")
        self.assertEqual(self.client.get("/api/accounts/me/").status_code, 200)
        rotated = self.client.post("/api/accounts/refresh/", {"refresh": token["refresh"]})
        self.assertEqual(rotated.status_code, 200)
        self.assertEqual(self.client.post("/api/accounts/refresh/", {"refresh": token["refresh"]}).status_code, 401)
        self.assertEqual(self.client.post("/api/accounts/logout/", {"refresh": rotated.data["refresh"]}).status_code, 204)
        self.assertEqual(self.client.post("/api/accounts/refresh/", {"refresh": rotated.data["refresh"]}).status_code, 401)

    def test_role_escalation_and_weak_password_rejected(self):
        for changes in ({"role": "admin"}, {"is_superuser": True}, {"password": "123"}):
            self.assertEqual(self.client.post("/api/accounts/register/", {**self.payload, **changes}).status_code, 400)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_inactive_user_cannot_login_or_refresh(self):
        user = get_user_model().objects.create_user(**self.payload)
        login = self.client.post("/api/accounts/login/", {"username": user.username, "password": self.payload["password"]})
        user.is_active = False
        user.save()
        self.assertEqual(self.client.post("/api/accounts/login/", {"username": user.username, "password": self.payload["password"]}).status_code, 401)
        self.assertEqual(self.client.post("/api/accounts/refresh/", {"refresh": login.data["refresh"]}).status_code, 401)

    def test_invalid_login_and_refresh_do_not_leak_errors(self):
        self.assertEqual(self.client.post("/api/accounts/login/", {"username": "missing", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.client.post("/api/accounts/refresh/", {"refresh": "bad"}).status_code, 401)
