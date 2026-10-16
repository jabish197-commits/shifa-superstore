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

from .models import Banner


def make_image(name="banner.png", image_format="PNG", padding=b""):
    buffer = BytesIO()
    Image.new("RGB", (100, 40), "green").save(buffer, format=image_format)
    return SimpleUploadedFile(name, buffer.getvalue() + padding)


class BannerTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model().objects
        cls.admin = users.create_superuser(username="banner_admin", password="Test-Admin-625!")
        cls.customer = users.create_user(username="banner_customer", password="Test-Buyer-718!")

    def setUp(self):
        media = TemporaryDirectory()
        self.addCleanup(media.cleanup)
        override = override_settings(MEDIA_ROOT=media.name)
        override.enable()
        self.addCleanup(override.disable)
        self.first = Banner.objects.create(title="First", alt_text="Fresh groceries", image=make_image(), display_order=1)
        self.second = Banner.objects.create(title="Second", alt_text="Offers", image=make_image(), display_order=2)
        self.hidden = Banner.objects.create(title="Hidden", alt_text="Draft", image=make_image(), is_active=False)
        self.list_url = reverse("banner-list")
        self.detail_url = reverse("banner-detail", args=[self.first.pk])

    def authenticate(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")

    def test_public_visibility_and_order(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.first.pk, self.second.pk])
        self.assertIn("/media/banners/", response.data[0]["image"])
        self.assertEqual(response.data[0]["alt_text"], "Fresh groceries")
        for user in (None, self.customer):
            if user:
                self.authenticate(user)
            for pk in (self.hidden.pk, 999999):
                self.assertEqual(self.client.get(reverse("banner-detail", args=[pk])).status_code, 404)

    def test_anonymous_and_customer_cannot_write(self):
        for user, expected in ((None, 401), (self.customer, 403)):
            if user:
                self.authenticate(user)
            for method, url, data in (
                ("post", self.list_url, {}), ("put", self.detail_url, {}),
                ("patch", self.detail_url, {"is_active": False}), ("delete", self.detail_url, {}),
            ):
                with self.subTest(user=user, method=method):
                    self.assertEqual(getattr(self.client, method)(url, data, format="json").status_code, expected)

    def test_admin_crud_and_image_replacement(self):
        self.authenticate(self.admin)
        response = self.client.post(self.list_url, {
            "title": "New", "alt_text": "Fresh produce", "image": make_image(),
        }, format="multipart")
        self.assertEqual(response.status_code, 201)
        pk = response.data["id"]
        url = reverse("banner-detail", args=[pk])
        response = self.client.patch(url, {
            "title": "Edited", "image": make_image("replacement.jpg", "JPEG"),
        }, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertIn("replacement", response.data["image"])
        banner = Banner.objects.get(pk=pk)
        self.assertTrue(banner.image.storage.exists(banner.image.name))
        self.assertEqual(len(self.client.get(self.list_url).data), 4)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Banner.objects.filter(pk=pk).exists())

    def test_activation_and_display_order(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.patch(self.detail_url, {"display_order": 5}).status_code, 200)
        self.client.credentials()
        self.assertEqual([item["id"] for item in self.client.get(self.list_url).data], [self.second.pk, self.first.pk])
        self.authenticate(self.admin)
        self.client.patch(self.detail_url, {"is_active": False})
        self.client.credentials()
        self.assertEqual(self.client.get(self.detail_url).status_code, 404)
        self.authenticate(self.admin)
        self.client.patch(self.detail_url, {"is_active": True})
        self.client.credentials()
        self.assertEqual(self.client.get(self.detail_url).status_code, 200)
        self.second.display_order = 5
        self.second.save(update_fields=["display_order"])
        self.assertEqual([item["id"] for item in self.client.get(self.list_url).data], [self.first.pk, self.second.pk])

    def test_required_fields_and_order_validation(self):
        self.authenticate(self.admin)
        response = self.client.post(self.list_url, {"title": "Test", "alt_text": "Test"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)
        for changes in ({"title": " "}, {"alt_text": " "}, {"display_order": -1}, {"display_order": 1.5}, {"image": None}):
            with self.subTest(changes=changes):
                self.assertEqual(self.client.patch(self.detail_url, changes, format="json").status_code, 400)

    def test_invalid_images(self):
        self.authenticate(self.admin)
        for image in (
            SimpleUploadedFile("fake.png", b"not an image"),
            make_image("unsupported.gif", "GIF"),
            make_image("large.png", padding=b"0" * (5 * 1024 * 1024)),
        ):
            with self.subTest(image=image.name):
                response = self.client.patch(self.detail_url, {"image": image}, format="multipart")
                self.assertEqual(response.status_code, 400)
                self.assertIn("image", response.data)

    def test_database_rejects_negative_order(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Banner.objects.filter(pk=self.first.pk).update(display_order=-1)

    def test_inactive_admin_is_rejected(self):
        self.authenticate(self.admin)
        self.admin.is_active = False
        self.admin.save(update_fields=["is_active"])
        self.assertEqual(self.client.patch(self.detail_url, {"title": "Blocked"}).status_code, 401)

    def test_admin_form_and_customer_access(self):
        url = reverse("admin:banners_banner_add")
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.client.force_login(self.customer)
        self.assertEqual(self.client.get(url).status_code, 302)
