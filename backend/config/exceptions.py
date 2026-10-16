import logging
from django.db import IntegrityError, OperationalError
from django.db.models.deletion import ProtectedError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response
    if isinstance(exc, ProtectedError):
        return Response({"detail": "This record is still in use and cannot be deleted."}, status=409)
    if isinstance(exc, IntegrityError):
        return Response({"detail": "This change conflicts with an existing record. Refresh and try again."}, status=409)
    if isinstance(exc, OperationalError):
        logger.exception("Database request failed")
        return Response({"detail": "The store is busy. Please try again shortly."}, status=503)
    logger.exception("Unexpected API error")
    return Response({"detail": "The request could not be completed. Please try again."}, status=500)
