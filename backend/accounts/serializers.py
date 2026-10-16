from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "password"]

    def validate(self, attrs):
        if any(key in self.initial_data for key in ("role", "is_staff", "is_superuser", "is_active", "groups", "user_permissions")):
            raise serializers.ValidationError("Account permissions cannot be set during registration.")
        user = User(**{key: value for key, value in attrs.items() if key != "password"})
        try:
            validate_password(attrs["password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(role=User.Role.CUSTOMER, **validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            result = super().validate(attrs)
        except AuthenticationFailed:
            raise AuthenticationFailed("Invalid username or password")
        result["user"] = UserSerializer(self.user).data
        return result


class RefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        token = RefreshToken(attrs["refresh"])
        if not User.objects.filter(pk=token["user_id"], is_active=True).exists():
            raise AuthenticationFailed("Your account is inactive.")
        return super().validate(attrs)
