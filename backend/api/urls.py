from django.urls import path
from .views import viewer_only_view, developer_only_view, admin_only_view, register_user, login_user, root_view, connect_to_host, start_container, stop_container, get_container_logs, get_container_details,create_host, create_container, get_container_stats, create_network, delete_network, connect_container_to_network, disconnect_container_from_network, host_detail_view, get_networks_by_host
from .views import container_connected_networks, create_exec_session, get_volumes_by_host, create_volume, delete_volume
from .consumers import TerminalConsumer

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
    path('<int:host_id>/<str:container_id>/', get_container_details, name='details'),
    path('<int:host_id>/<str:container_id>/stats/', get_container_stats, name='stats'),
    path('hosts/create/', create_host, name='create-host'),
    path('hosts/<int:host_id>/containers/', host_detail_view, name='view-containers'), 
    path('hosts/<int:host_id>/containers/create/', create_container, name='create-container'),
    path('networks/create/', create_network, name='create-network'),
    path('networks/<str:network_id>/delete/', delete_network, name='delete-network'),
    path('networks/connect/', connect_container_to_network, name='connect-container-to-network'),
    path('networks/disconnect/', disconnect_container_from_network, name='disconnect-container'),
    path('hosts/<int:host_id>/networks/', get_networks_by_host, name='networks-by-host'),
    path('<int:host_id>/<str:container_id>/networks/', container_connected_networks, name='container-connected-networks'),
    path('<int:host_id>/<str:container_id>/exec/', create_exec_session, name='create-exec'),
    path('hosts/<int:host_id>/volumes/', get_volumes_by_host, name='list-volumes-by-host'),
    path('hosts/<int:host_id>/volumes/create/', create_volume, name='create-volume'),
    path('volumes/<str:volume_id>/delete/', delete_volume, name='delete-volume'),
]