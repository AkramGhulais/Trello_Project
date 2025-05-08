"""
ASGI config for trello_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from .routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')

# تطبيق Django الأساسي
django_asgi_app = get_asgi_application()

# تم نقل مسارات WebSocket إلى ملف routing.py

# تكوين ASGI مع دعم HTTP و WebSocket
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
