"""Copy this file to backend/products/bulk.py."""
import csv
import io
import warnings
import zipfile
from pathlib import PurePosixPath

from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import transaction
from django.http import HttpResponse
from PIL import Image
from rest_framework.exceptions import ValidationError

from brands.models import Brand
from categories.models import Category
from .models import Product
from .serializers import ProductSerializer

HEADERS = ["product_id", "name", "description", "category", "brand", "price", "stock", "image_filename", "is_active"]
MAX_ROWS = 500
MAX_IMAGE = 5 * 1024 * 1024
SALT = "products.csv-import.v1"


def safe_cell(value):
    value = str(value)
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) else value


def text_cell(value):
    value = (value or "").strip()
    if value.startswith("'") and value[1:].lstrip().startswith(("=", "+", "-", "@")):
        return value[1:]
    return value


def export_csv(template=False):
    stream = io.StringIO(newline="")
    writer = csv.writer(stream)
    writer.writerow(HEADERS)
    if not template:
        for p in Product.objects.select_related("category", "brand").order_by("id").iterator():
            writer.writerow([safe_cell(v) for v in [
                p.pk, p.name, p.description,
                p.category.name if p.category_id else "",
                p.brand.name if p.brand_id else "",
                p.price, p.stock, PurePosixPath(p.image.name).name if p.image else "",
                "true" if p.is_active else "false",
            ]])
    response = HttpResponse("\ufeff" + stream.getvalue(), content_type="text/csv; charset=utf-8")
    filename = "shifa-product-template.csv" if template else "shifa-products.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def read_images(upload):
    if not upload:
        return {}
    if upload.size > 25 * 1024 * 1024:
        raise ValidationError({"images": "ZIP must be 25 MB or smaller."})
    images = {}
    try:
        with zipfile.ZipFile(upload) as archive:
            entries = archive.infolist()
            if len(entries) > 1000 or sum(i.file_size for i in entries) > 80 * 1024 * 1024:
                raise ValueError("ZIP contains too many files or exceeds 80 MB uncompressed.")
            for info in entries:
                path = PurePosixPath(info.filename)
                if path.is_absolute() or ".." in path.parts or "\\" in info.filename or ":" in info.filename:
                    raise ValueError("ZIP contains an unsafe filename.")
                if (info.external_attr >> 16) & 0o170000 == 0o120000:
                    raise ValueError("ZIP must not contain symbolic links.")
                if info.is_dir() or path.name.startswith(".") or "__MACOSX" in path.parts:
                    continue
                if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                    raise ValueError(f"Unsupported image: {path.name}")
                if info.file_size > MAX_IMAGE or info.flag_bits & 1:
                    raise ValueError(f"Image is too large or encrypted: {path.name}")
                if path.name in images:
                    raise ValueError(f"Duplicate image filename: {path.name}")
                data = archive.read(info)
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    with Image.open(io.BytesIO(data)) as image:
                        if image.format not in {"JPEG", "PNG", "WEBP"}:
                            raise ValueError(f"Unsupported image content: {path.name}")
                        image.verify()
                images[path.name] = data
    except (zipfile.BadZipFile, RuntimeError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValidationError({"images": str(exc)}) from exc
    return images


def prepare(request):
    upload = request.FILES.get("csv_file")
    if not upload or upload.size > 2 * 1024 * 1024:
        raise ValidationError({"csv_file": "Choose a UTF-8 CSV file, maximum 2 MB."})
    try:
        reader = csv.DictReader(io.StringIO(upload.read().decode("utf-8-sig"), newline=""), strict=True)
        if reader.fieldnames != HEADERS:
            raise ValueError("Column names and order must match the downloaded template.")
        rows = []
        for row in reader:
            if len(rows) >= MAX_ROWS:
                raise ValueError("Import up to 500 products at a time.")
            if None in row or any(value is None for value in row.values()):
                raise ValueError("A row has extra or missing columns.")
            rows.append({key: text_cell(value) for key, value in row.items()})
        if not rows:
            raise ValueError("The CSV has no product rows.")
    except (UnicodeError, csv.Error, ValueError) as exc:
        raise ValidationError({"csv_file": str(exc)}) from exc
    images = read_images(request.FILES.get("images"))
    serializers, preview, errors, versions = [], [], [], []
    seen_ids, seen_names = set(), set()
    for index, row in enumerate(rows, start=2):
        try:
            instance = None
            if row["product_id"]:
                if not row["product_id"].isdigit() or int(row["product_id"]) < 1:
                    raise ValidationError("product_id must be a positive integer or blank.")
                pk = int(row["product_id"])
                if pk in seen_ids:
                    raise ValidationError("Duplicate product_id in CSV.")
                seen_ids.add(pk)
                instance = Product.objects.select_for_update().filter(pk=pk).first()
                if instance is None:
                    raise ValidationError("Product ID does not exist.")
            name = row["name"]
            if name.casefold() in seen_names:
                raise ValidationError("Duplicate product name in CSV.")
            seen_names.add(name.casefold())
            existing = Product.objects.filter(name__iexact=name)
            if instance:
                existing = existing.exclude(pk=instance.pk)
            if existing.exists():
                raise ValidationError("Name already exists. Use its product_id to update it.")
            data = {key: row[key] for key in ("name", "description", "price", "stock")}
            if row["is_active"].lower() not in {"true", "false"}:
                raise ValidationError("is_active must be true or false.")
            data["is_active"] = row["is_active"].lower() == "true"
            for field, model in (("category", Category), ("brand", Brand)):
                matches = list(model.objects.filter(name__iexact=row[field])[:2]) if row[field] else []
                if row[field] and len(matches) != 1:
                    raise ValidationError(f"Unknown or ambiguous {field}: {row[field]}. Create it in admin first.")
                data[field] = matches[0].pk if matches else None
                if matches and data["is_active"] and not matches[0].is_active:
                    raise ValidationError(f"Activate the selected {field} first, or import this product as inactive.")
            filename = row["image_filename"]
            if filename:
                if PurePosixPath(filename).name != filename or "\\" in filename:
                    raise ValidationError("image_filename must be a filename without folders.")
                if filename in images:
                    data["image"] = SimpleUploadedFile(filename, images[filename])
                elif not (instance and instance.image and PurePosixPath(instance.image.name).name == filename):
                    raise ValidationError(f"Image missing from ZIP: {filename}")
            serializer = ProductSerializer(instance, data=data)
            serializer.is_valid(raise_exception=True)
            serializers.append(serializer)
            preview.append({"row": index, "action": "update" if instance else "create", "name": name, "price": row["price"], "stock": row["stock"], "image": "uploaded" if "image" in data else "unchanged" if instance and instance.image else "placeholder"})
            versions.append([instance.pk if instance else None, instance.updated_at.isoformat() if instance else None, data["category"], data["brand"]])
        except ValidationError as exc:
            errors.append({"row": index, "message": exc.detail})
    # Bind confirmation to these exact inputs and the product versions previewed.
    import hashlib
    import json
    fingerprint = hashlib.sha256(json.dumps([rows, versions, {key: hashlib.sha256(value).hexdigest() for key, value in sorted(images.items())}], sort_keys=True).encode()).hexdigest()
    return serializers, preview, errors, fingerprint


def import_csv(request):
    saved_images = []
    try:
        with transaction.atomic():
            return _import_csv(request, saved_images)
    except Exception:
        for storage, name in saved_images:
            try:
                storage.delete(name)
            except OSError:
                pass
        raise


def _import_csv(request, saved_images):
    serializers, preview, errors, fingerprint = prepare(request)
    if errors:
        return {"valid": False, "errors": errors, "rows": preview}
    if request.data.get("confirm") != "true":
        token = signing.dumps({"user": request.user.pk, "fingerprint": fingerprint}, salt=SALT)
        return {"valid": True, "rows": preview, "errors": [], "preview_token": token}
    try:
        signed = signing.loads(request.data.get("preview_token", ""), salt=SALT, max_age=1800)
    except signing.BadSignature as exc:
        raise ValidationError("Preview expired or invalid. Preview the files again.") from exc
    if signed != {"user": request.user.pk, "fingerprint": fingerprint}:
        raise ValidationError("Files or products changed since preview. Preview again.")
    field = Product._meta.get_field("image")
    for serializer in serializers:
        image = serializer.validated_data.get("image")
        if image:
            path = field.generate_filename(serializer.instance or Product(), image.name)
            name = field.storage.save(path, image, max_length=field.max_length)
            saved_images.append((field.storage, name))
            serializer.validated_data["image"] = name
        serializer.save()
    return {"valid": True, "imported": len(serializers), "created": sum(row["action"] == "create" for row in preview), "updated": sum(row["action"] == "update" for row in preview)}
