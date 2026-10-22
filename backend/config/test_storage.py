import tempfile
from django.test import SimpleTestCase, override_settings
from django.core.files.base import ContentFile
from .storage import CatalogueSnapshotStorage


class CatalogueSnapshotStorageTests(SimpleTestCase):
    @override_settings(CATALOGUE_MEDIA_URL='https://example.com/catalogue-media/')
    def test_archived_photo_uses_durable_snapshot_and_new_upload_keeps_local_url(self):
        import json
        from pathlib import Path
        archived = json.loads(Path(__file__).with_name('catalogue_media.json').read_text())[0]
        with tempfile.TemporaryDirectory() as directory:
            storage = CatalogueSnapshotStorage(location=directory, base_url='/media/')
            self.assertTrue(storage.url(archived).startswith('https://example.com/catalogue-media/'))
            self.assertEqual(storage.url('products/new.jpg'), '/media/products/new.jpg')
            storage.save(archived, ContentFile(b'replacement'))
            self.assertTrue(storage.url(archived).startswith('/media/'))
