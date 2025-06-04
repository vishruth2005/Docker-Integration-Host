from django.urls import path
from .views import viewer_only_view, developer_only_view, admin_only_view, register_user, login_user, root_view, connect_to_host, start_container

urlpatterns = [
    path('viewer-only/', viewer_only_view, name='viewer'),
    path('developer-only/', developer_only_view, name='developer'),
    path('admin-only/', admin_only_view, name='admin'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('', root_view, name='root'),
    path('connect/<int:host_id>/', connect_to_host, name='connect'),
    path('start/<int:host_id>/<str:container_id>/', start_container, name='start'),
]