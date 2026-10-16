import tempfile
from io import BytesIO
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from .models import Category

class CategoryImageTests(APITestCase):
    def setUp(self):
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.override = override_settings(MEDIA_ROOT=self.media.name)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.admin = get_user_model().objects.create_superuser(username="image_admin", password="Image-test-836!")
        self.client.force_authenticate(self.admin)

    def image(self, name="category.png"):
        data = BytesIO()
        Image.new("RGB", (30,30), "green").save(data, format="PNG")
        return SimpleUploadedFile(name, data.getvalue(), content_type="image/png")

    def test_upload_replace_public_url_and_preserve_on_edit(self):
        response = self.client.post("/api/categories/", {"name":"Vegetables", "is_active":True, "image":self.image()}, format="multipart")
        self.assertEqual(response.status_code, 201, response.data)
        pk = response.data["id"]
        first = Category.objects.get(pk=pk).image.name
        self.assertIn("/media/categories/", response.data["image"])
        response = self.client.patch(f"/api/categories/{pk}/", {"description":"Fresh choices"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Category.objects.get(pk=pk).image.name, first)
        response = self.client.patch(f"/api/categories/{pk}/", {"image":self.image("replacement.png")}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(Category.objects.get(pk=pk).image.name, first)
        self.client.force_authenticate(None)
        self.assertIn("/media/categories/", self.client.get(f"/api/categories/{pk}/").data["image"])

    def test_invalid_and_large_uploads_rejected(self):
        response = self.client.post("/api/categories/", {"name":"Bad", "image":SimpleUploadedFile("bad.png",b"not an image",content_type="image/png")},format="multipart")
        self.assertEqual(response.status_code,400)
        image = self.image()
        large = SimpleUploadedFile("large.png", image.read()+b"0"*(5*1024*1024),content_type="image/png")
        response = self.client.post("/api/categories/", {"name":"Large", "image":large},format="multipart")
        self.assertEqual(response.status_code,400)
        response = self.client.post("/api/categories/", {"name":"Wrong extension", "image":self.image("bad.gif")},format="multipart")
        self.assertEqual(response.status_code,400)

    def test_customer_cannot_upload_and_image_is_optional(self):
        response = self.client.post("/api/categories/", {"name":"No image"},format="json")
        self.assertEqual(response.status_code,201)
        customer=get_user_model().objects.create_user(username="image_customer",password="Customer-test-486!")
        self.client.force_authenticate(customer)
        response=self.client.patch(f"/api/categories/{response.data['id']}/", {"image":self.image()},format="multipart")
        self.assertEqual(response.status_code,403)
