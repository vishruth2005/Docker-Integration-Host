from django.urls import path
from .views import viewer_only_view, developer_only_view, admin_only_view, register_user, login_user, root_view, connect_to_host, start_container, stop_container, get_container_logs, get_container_stats,create_host, create_container 

urlpatterns = [
    path('viewer-only/', viewer_only_view, name='viewer'),
    path('developer-only/', developer_only_view, name='developer'),
    path('admin-only/', admin_only_view, name='admin'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('', root_view, name='root'),
    path('<int:host_id>/connect', connect_to_host, name='connect'),
    path('<int:host_id>/<str:container_id>/start/', start_container, name='start'),
    path('<int:host_id>/<str:container_id>/stop/', stop_container, name='stop'),
    path('<int:host_id>/<str:container_id>/logs/', get_container_logs, name='logs'),
    path('<int:host_id>/<str:container_id>/', get_container_stats, name='stats'),
    path('hosts/create/', create_host, name='create-host'),
    path('<int:host_id>/containers/create/', create_container, name='create-container'),
]