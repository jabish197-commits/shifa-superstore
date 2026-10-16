from types import SimpleNamespace

from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from .models import User
from .permissions import IsAdmin, IsCustomer


class AccountsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.customer = User.objects.create_user(
            username="customer", password="Test-only-password-482!"
        )
        cls.admin = User.objects.create_superuser(
            username="admin", password="Test-only-password-937!"
        )

    def test_customer_password_is_hashed(self):
        self.assertEqual(self.customer.role, User.Role.CUSTOMER)
        self.assertFalse(self.customer.is_staff)
        self.assertFalse(self.customer.is_superuser)
        self.assertNotEqual(self.customer.password, "Test-only-password-482!")
        self.assertTrue(self.customer.check_password("Test-only-password-482!"))

    def test_admin_has_admin_role(self):
        self.assertEqual(self.admin.role, User.Role.ADMIN)
        self.assertTrue(self.admin.is_staff)
        self.assertTrue(self.admin.is_superuser)

    def test_admin_manager_rejects_customer_role(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(username="invalid", role="customer")

    def test_unknown_role_is_rejected(self):
        self.customer.role = "vendor"
        with self.assertRaises(ValidationError):
            self.customer.save()

    def test_role_change_updates_django_access(self):
        self.admin.role = User.Role.CUSTOMER
        self.admin.save(update_fields=["role"])
        self.admin.refresh_from_db()
        self.assertFalse(self.admin.is_staff)
        self.assertFalse(self.admin.is_superuser)

    def test_database_rejects_permission_bypass(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=self.customer.pk).update(is_staff=True)

    def test_database_rejects_unknown_role(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=self.customer.pk).update(role="vendor")

    def test_role_permissions(self):
        for user, admin_allowed, customer_allowed in [
            (self.admin, True, False),
            (self.customer, False, True),
            (AnonymousUser(), False, False),
        ]:
            with self.subTest(user=str(user)):
                request = SimpleNamespace(user=user)
                self.assertEqual(IsAdmin().has_permission(request, None), admin_allowed)
                self.assertEqual(IsCustomer().has_permission(request, None), customer_allowed)
        for user in (self.admin, self.customer):
            user.is_active = False
            request = SimpleNamespace(user=user)
            self.assertFalse(IsAdmin().has_permission(request, None))
            self.assertFalse(IsCustomer().has_permission(request, None))

    def test_customer_cannot_open_django_admin(self):
        self.client.force_login(self.customer)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("admin:login"), response.url)

    def test_admin_can_open_user_forms(self):
        self.client.force_login(self.admin)
        for url in (
            reverse("admin:index"),
            reverse("admin:accounts_user_add"),
            reverse("admin:accounts_user_change", args=[self.customer.pk]),
        ):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)

    def test_admin_can_create_both_roles_with_hashed_passwords(self):
        self.client.force_login(self.admin)
        for role in User.Role.values:
            with self.subTest(role=role):
                response = self.client.post(reverse("admin:accounts_user_add"), {
                    "username": f"new_{role}",
                    "email": f"{role}@example.com",
                    "role": role,
                    "password1": "Form-test-password-672!",
                    "password2": "Form-test-password-672!",
                })
                self.assertEqual(response.status_code, 302)
                user = User.objects.get(username=f"new_{role}")
                self.assertEqual(user.role, role)
                self.assertEqual(user.is_staff, role == User.Role.ADMIN)
                self.assertTrue(user.check_password("Form-test-password-672!"))
