from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsCustomer
from products.models import Product
from .models import Cart, CartItem
from .serializers import AddItemSerializer, QuantitySerializer, cart_data


def validate_quantity(product, quantity):
    if not product.in_stock:
        raise ValidationError("Product is out of stock or unavailable.")
    if quantity > min(product.stock, 99):
        raise ValidationError(f"Only {min(product.stock, 99)} units can be added.")


class CartView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(cart_data(cart, request))

    @transaction.atomic
    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart, _ = Cart.objects.select_for_update().get_or_create(user=request.user)
        product = get_object_or_404(Product.objects.select_related("category", "brand"), pk=serializer.validated_data["product_id"])
        item = cart.items.filter(product=product).first()
        quantity = serializer.validated_data["quantity"] + (item.quantity if item else 0)
        validate_quantity(product, quantity)
        if item:
            item.quantity = quantity
            item.save(update_fields=["quantity"])
        else:
            if cart.items.count() >= 100:
                raise ValidationError("A cart can contain at most 100 different products.")
            CartItem.objects.create(cart=cart, product=product, quantity=quantity)
        return Response(cart_data(cart, request))

    @transaction.atomic
    def delete(self, request):
        cart, _ = Cart.objects.select_for_update().get_or_create(user=request.user)
        cart.items.all().delete()
        return Response(cart_data(cart, request))


class CartItemView(APIView):
    permission_classes = [IsCustomer]

    @transaction.atomic
    def patch(self, request, pk):
        serializer = QuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_object_or_404(Cart.objects.select_for_update(), user=request.user)
        item = get_object_or_404(cart.items.select_related("product__category", "product__brand"), pk=pk)
        quantity = serializer.validated_data["quantity"]
        validate_quantity(item.product, quantity)
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(cart_data(cart, request))

    @transaction.atomic
    def delete(self, request, pk):
        cart = get_object_or_404(Cart.objects.select_for_update(), user=request.user)
        item = get_object_or_404(cart.items, pk=pk)
        item.delete()
        return Response(cart_data(cart, request))
