"""Isolated browser fixture setup. Never touches the default store database."""
import os
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
path = os.environ.get("DJANGO_DB_PATH", "")
if not path or Path(path).name != "shifa-e2e.sqlite3":
    raise SystemExit("DJANGO_DB_PATH must point to an isolated shifa-e2e.sqlite3 file")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.core.management import call_command
from django.contrib.auth import get_user_model
from categories.models import Category
from brands.models import Brand
from products.models import Product
from delivery_areas.models import DeliveryArea
from offers.models import Offer
from django.utils import timezone
from datetime import timedelta
call_command("migrate", interactive=False, verbosity=0)
call_command("flush", interactive=False, verbosity=0)
get_user_model().objects.create_superuser(username="e2e_admin", password="Browser-test-827!", email="admin@example.test")
category = Category.objects.create(name="Pantry essentials")
brand = Brand.objects.create(name="Shifa selection")
p = Product.objects.create(name="Test Basmati Rice", description="Quality rice for everyday cooking. Test fixture only.", category=category, brand=brand, price="100.00", stock=20)
Product.objects.create(name="Test Lentils", category=category, brand=brand, price="80.00", stock=10)
Product.objects.create(name="Test Sold Out", category=category, price="30.00", stock=0)
DeliveryArea.objects.create(area_name="Test Area", pincode="629165")
offer = Offer.objects.create(title="Test Fresh Picks", discount_percent="10", starts_at=timezone.now()-timedelta(days=1), ends_at=timezone.now()+timedelta(days=1))
offer.products.add(p)
print("Isolated E2E fixtures ready")
