"""Serve the migrated catalogue snapshot from the static site's durable assets."""
import json
from pathlib import Path
from urllib.parse import quote

from django.conf import settings
from django.core.files.storage import FileSystemStorage


class CatalogueSnapshotStorage(FileSystemStorage):
    def url(self, name):
        archive_url = getattr(settings, 'CATALOGUE_MEDIA_URL', '')
        manifest = Path(__file__).with_name('catalogue_media.json')
        if archive_url and manifest.is_file():
            archived_names = json.loads(manifest.read_text(encoding='utf-8'))
            if name in archived_names and not self.exists(name):
                return archive_url.rstrip('/') + '/' + quote(name, safe='/')
        return super().url(name)
