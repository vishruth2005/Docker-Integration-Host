from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/socket-server/', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/stats/', consumers.StatsConsumer.as_asgi()),
    re_path(r'ws/terminal/(?P<container_id>[^/]+)/(?P<exec_id>[^/]+)/$', consumers.TerminalConsumer.as_asgi()),
]
