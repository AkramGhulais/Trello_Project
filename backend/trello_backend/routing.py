from django.urls import re_path
from . import consumers
from . import organization_consumer

websocket_urlpatterns = [
    # مسار WebSocket للمشاريع
    re_path(r'ws/projects/(?P<project_id>\w+)/$', consumers.TaskConsumer.as_asgi()),
    
    # مسار WebSocket للمؤسسات
    re_path(r'ws/org/(?P<organization_slug>\w+)/tasks/$', organization_consumer.OrganizationConsumer.as_asgi()),
]
