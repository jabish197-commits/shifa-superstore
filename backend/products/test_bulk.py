import csv
import io
import zipfile
from tempfile import TemporaryDirectory
from unittest.mock import patch

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from categories.models import Category
from products.bulk import HEADERS
from products.models import Product


class BulkProductTests(APITestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.temp.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.admin = get_user_model().objects.create_superuser(username="bulk_admin", password="Testing-Import-394!")
        self.category = Category.objects.create(name="Kitchen")
        self.client.force_authenticate(self.admin)
        self.url = "/api/products/import-csv/"

    def csv(self, rows):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(HEADERS)
        writer.writerows(rows)
        return SimpleUploadedFile("products.csv", output.getvalue().encode("utf-8-sig"), content_type="text/csv")

    def row(self, **overrides):
        fields = dict.fromkeys(HEADERS, "")
        fields.update(name="Steel Scrubber", category="Kitchen", price="40.00", stock="50", is_active="true")
        fields.update(overrides)
        return [fields[key] for key in HEADERS]

    def images(self, unsafe=False):
        output = io.BytesIO()
        image = io.BytesIO()
        Image.new("RGB", (12, 12), "green").save(image, "PNG")
        with zipfile.ZipFile(output, "w") as archive:
            archive.writestr("../scrub.png" if unsafe else "images/scrub.png", image.getvalue())
        return SimpleUploadedFile("images.zip", output.getvalue(), content_type="application/zip")

    def test_preview_then_create_with_image_and_public_visibility(self):
        rows = [self.row(image_filename="scrub.png")]
        response = self.client.post(self.url, {"csv_file": self.csv(rows), "images": self.images()}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valid"])
        self.assertFalse(Product.objects.exists())
        token = response.data["preview_token"]
        response = self.client.post(self.url, {"csv_file": self.csv(rows), "images": self.images(), "confirm": "true", "preview_token": token}, format="multipart")
        self.assertEqual(response.data["created"], 1)
        product = Product.objects.get()
        self.assertTrue(product.image.storage.exists(product.image.name))
        self.client.force_authenticate(None)
        public = self.client.get(f"/api/products/{product.pk}/")
        self.assertEqual(public.status_code, 200)
        self.assertTrue(public.data["image"])

    def test_import_and_export_are_admin_only(self):
        for user in [None, get_user_model().objects.create_user(username="bulk_customer", password="Test-Buyer-324!")]:
            self.client.force_authenticate(user)
            self.assertIn(self.client.get("/api/products/export-csv/").status_code, [401, 403])
            self.assertIn(self.client.post(self.url, {"csv_file": self.csv([self.row()])}, format="multipart").status_code, [401, 403])

    def test_any_invalid_row_prevents_all_writes(self):
        response = self.client.post(self.url, {"csv_file": self.csv([self.row(), self.row(name="Bad", price="-1")]), "confirm": "true"}, format="multipart")
        self.assertFalse(response.data["valid"])
        self.assertEqual(response.data["errors"][0]["row"], 3)
        self.assertFalse(Product.objects.exists())

    def test_unsafe_zip_rejected_without_extraction(self):
        response = self.client.post(self.url, {"csv_file": self.csv([self.row()]), "images": self.images(unsafe=True)}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Product.objects.exists())

    def test_export_update_preserves_image_and_other_products(self):
        product = Product.objects.create(name="=Scrubber", category=self.category, price=40, stock=3)
        other = Product.objects.create(name="Other", price=10)
        response = self.client.get("/api/products/export-csv/")
        exported = list(csv.reader(io.StringIO(response.content.decode("utf-8-sig"))))
        self.assertEqual(exported[1][1], "'=Scrubber")
        rows = [exported[1]]
        rows[0][6] = "50"
        token = self.client.post(self.url, {"csv_file": self.csv(rows)}, format="multipart").data["preview_token"]
        response = self.client.post(self.url, {"csv_file": self.csv(rows), "confirm": "true", "preview_token": token}, format="multipart")
        self.assertEqual(response.data["updated"], 1)
        product.refresh_from_db()
        self.assertEqual(product.stock, 50)
        self.assertEqual(product.name, "=Scrubber")
        self.assertTrue(Product.objects.filter(pk=other.pk).exists())

    def test_confirmation_is_bound_to_preview_and_current_product(self):
        product = Product.objects.create(name="Steel Scrubber", category=self.category, price=40, stock=3)
        rows = [self.row(product_id=str(product.pk))]
        token = self.client.post(self.url, {"csv_file": self.csv(rows)}, format="multipart").data["preview_token"]
        product.stock = 2
        product.save()
        response = self.client.post(self.url, {"csv_file": self.csv(rows), "confirm": "true", "preview_token": token}, format="multipart")
        self.assertEqual(response.status_code, 400)
        product.refresh_from_db()
        self.assertEqual(product.stock, 2)

    def test_database_failure_removes_new_images(self):
        rows = [self.row(image_filename="scrub.png")]
        token = self.client.post(self.url, {"csv_file": self.csv(rows), "images": self.images()}, format="multipart").data["preview_token"]
        with patch("products.bulk.ProductSerializer.save", side_effect=RuntimeError("save failed")):
            response = self.client.post(self.url, {"csv_file": self.csv(rows), "images": self.images(), "confirm": "true", "preview_token": token}, format="multipart")
            self.assertEqual(response.status_code, 500)
        from pathlib import Path
        self.assertEqual(list(Path(self.temp.name).rglob("*.png")), [])
        self.assertFalse(Product.objects.exists())
