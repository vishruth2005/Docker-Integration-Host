import docker.errors
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework import status
from .serializers import UserRegistrationSerializer, UserLoginSerializer, CustomTokenObtainPairSerializer, ContainerRecordSerializer, DockerHostSerializer, NetworkSerializer, VolumeSerializer
from .models import ContainerRecord, DockerHost, Network, Volume
from django.contrib.auth.models import Group, Permission
from rest_framework_simplejwt.tokens import RefreshToken
import docker
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction


def create_default_groups():
    for role in ['admin', 'developer', 'viewer']:
        Group.objects.get_or_create(name=role)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='admin').exists()

class IsDeveloper(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='developer').exists()

class IsViewer(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='viewer').exists()
    
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def root_view(request):
    return Response({"message": f"Welcome {request.user.username}"})

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_only_view(request):
    # Admin can see all hosts
    hosts = DockerHost.objects.all()
    serializer = DockerHostSerializer(hosts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsDeveloper])
def developer_only_view(request):
    # Developer can see hosts they own
    hosts = DockerHost.objects.filter(owner=request.user)
    serializer = DockerHostSerializer(hosts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsViewer])
def viewer_only_view(request):
    # Viewer can see hosts they own
    hosts = DockerHost.objects.filter(owner=request.user)
    serializer = DockerHostSerializer(hosts, many=True)
    return Response(serializer.data)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    roles = list(user.groups.values_list('name', flat=True))
    if roles:
        refresh['role'] = roles[0]  # Add role to token payload
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def start_container(request, host_id,container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        container.start()
        return Response({"message": "Container started successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def stop_container(request, host_id,container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        container.stop()
        return Response({"message": "Container stopped successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_container_logs(request, host_id,container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        logs = container.get_logs()
        return Response({"logs": logs.decode('utf-8')}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_container_details(request, host_id, container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        serializer = ContainerRecordSerializer(container)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_container_stats(request, host_id, container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        stats = container.stats(stream=False)
        return Response(stats, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def connect_to_host(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id, owner=request.user)
        is_connected = host.test_connection()
        host.save()
        if is_connected:
            return Response({"message": "Host is reachable and connection is successful."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Failed to connect to the Docker host."}, status=status.HTTP_400_BAD_REQUEST)
    except DockerHost.DoesNotExist:
        return Response({"message": "Docker host not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_host(request):
    serializer = DockerHostSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        try:
            host = serializer.save(owner=request.user)
            # Test connection to the host
            is_connected = host.test_connection()
            if is_connected:
                return Response({
                    'message': 'Docker host created successfully',
                    'host': DockerHostSerializer(host).data
                }, status=status.HTTP_201_CREATED)
            else:
                host.delete()
                return Response({
                    'message': 'Could not connect to Docker host'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_container(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id)
        
        # Check permissions
        if not (request.user.is_admin() or request.user == host.owner):
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        # Required fields in request.data
        required_fields = ['image', 'name']
        if not all(field in request.data for field in required_fields):
            return Response({
                'message': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle volumes: expect a list of volume IDs
        volume_ids = request.data.get('volumes', [])
        volumes_qs = Volume.objects.filter(id__in=volume_ids, host=host)
        # For Docker SDK, mount at /mnt/{volume_name}
        docker_volumes = {v.name: {'bind': f'/mnt/{v.name}', 'mode': 'rw'} for v in volumes_qs}

        # Create container record
        container_data = {
            'container_id': '',  
            'name': request.data['name'],
            'image': request.data['image'],
            'status': 'creating',
            'created_at': timezone.now(),
            'host': host,
            'created_by': request.user
        }

        # Optional configuration
        container_config = {
            'name': request.data['name'],
            'image': request.data['image'],
            'ports': request.data.get('ports', {}),
            'environment': request.data.get('environment', {}),
            'volumes': docker_volumes,
            'command': request.data.get('command', None)
        }

        try:
            # Create container in Docker
            client = docker.DockerClient(base_url=f"{host.docker_api_url}")

            # Pull image if not found
            try:
                client.images.get(request.data['image'])
            except docker.errors.NotFound:
                client.images.pull(request.data['image'])

            docker_container = client.containers.create(**container_config)

        except docker.errors.APIError as e:
            if 'port is already allocated' in str(e).lower():
                return Response({
                    'message': 'Port conflict: A container on this host is already using one of the requested ports.'
                }, status=status.HTTP_409_CONFLICT)
            return Response({
                'message': f'Docker API error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'message': f'Error creating container: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        with transaction.atomic():    
            container = ContainerRecord.objects.create(
                container_id=docker_container.id,
                name=request.data['name'],
                image=request.data['image'],
                status='created',
                created_at=timezone.now(),
                host=host,
                created_by=request.user
            )
            container.volumes.set(volumes_qs)

            if 'viewable_by' in request.data:
                container.viewable_by.add(*request.data['viewable_by'])
            if 'editable_by' in request.data:
                container.editable_by.add(*request.data['editable_by'])

            if request.data.get('start', False):
                docker_container.start()
                container.status = 'running'
                container.save()

            serializer = ContainerRecordSerializer(container)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    except DockerHost.DoesNotExist:
        return Response({
            'message': 'Docker host not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_container(request, host_id, container_id):
    try:
        container = ContainerRecord.objects.get(host__id=host_id, container_id=container_id)

        if not (request.user.is_admin() or request.user == container.created_by or request.user in container.editable_by.all()):
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            client = docker.DockerClient(base_url=container.host.docker_api_url)

            try:
                docker_container = client.containers.get(container_id)

                if docker_container.status == 'running':
                    docker_container.stop()
                
                docker_container.remove()

            except docker.errors.NotFound:
                # Container doesn't exist in Docker — treat as soft-deleted
                pass
            except docker.errors.DockerAPIError as e:
                return Response({
                    'message': f'Docker API error: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            container.delete()
            
            return Response({
                'message': 'Container deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        
        except DockerHost.DoesNotExist:
            return Response({
                'message': 'Docker host not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except ContainerRecord.DoesNotExist:
        return Response({'message': 'Container not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def host_detail_view(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id)
        host_serializer = DockerHostSerializer(host)
        
        # Get containers based on user role and permissions
        if request.user.groups.filter(name='admin').exists():
            containers = ContainerRecord.objects.filter(host=host)
        elif request.user.groups.filter(name='developer').exists():
            containers = ContainerRecord.objects.filter(
                host=host
            ).filter(
                Q(created_by=request.user) |
                Q(editable_by=request.user)
            ).distinct()
        else:
            containers = ContainerRecord.objects.filter(
                host=host
            ).filter(
                Q(viewable_by=request.user)
            ).distinct()

        container_serializer = ContainerRecordSerializer(containers, many=True)

        return Response({
            'host': host_serializer.data,
            'containers': container_serializer.data
        }, status=status.HTTP_200_OK)

    except DockerHost.DoesNotExist:
        return Response({
            'message': 'Host not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def register_user(request):
    create_default_groups()
    serializer = UserRegistrationSerializer(data=request.data)
    role = request.data.get('role')  # 'admin', 'developer', or 'viewer'
    if serializer.is_valid():
        user = serializer.save()
        if role in ['admin', 'developer', 'viewer']:
            group = Group.objects.get(name=role)
            user.groups.add(group)
        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': tokens,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': tokens,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_network(request):
    serializer = NetworkSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        try:
            # Extract the Docker host from validated data
            host = serializer.validated_data['host']

            # Connect to the Docker engine on that host
            client = docker.DockerClient(base_url=host.docker_api_url)

            # Create the Docker network via SDK
            docker_network = client.networks.create(
                name=serializer.validated_data['name'],
                driver=serializer.validated_data['driver'],
                internal=serializer.validated_data.get('internal', False),
                attachable=serializer.validated_data.get('attachable', False),
                ingress=serializer.validated_data.get('ingress', False),
                scope=serializer.validated_data.get('scope', 'local')
            )

            # Save the network instance manually using the Docker network ID as the primary key
            network_instance = Network.objects.create(
                id=docker_network.id,  # <-- IMPORTANT: this is your primary key
                name=serializer.validated_data['name'],
                driver=serializer.validated_data['driver'],
                scope=serializer.validated_data.get('scope', 'local'),
                internal=serializer.validated_data.get('internal', False),
                attachable=serializer.validated_data.get('attachable', False),
                ingress=serializer.validated_data.get('ingress', False),
                host=host
            )

            return Response({
                'message': 'Docker network created successfully',
                'network': NetworkSerializer(network_instance).data
            }, status=status.HTTP_201_CREATED)

        except docker.errors.APIError as e:
            return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    else:
        print(serializer.errors)  # Debugging line to check validation errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_network(request, network_id):
    try:
        # Get the Network object from the database
        network = Network.objects.get(id=network_id)

        # Connect to the Docker host where the network exists
        client = docker.DockerClient(base_url=network.host.docker_api_url)

        # Get the network object from Docker
        docker_network = client.networks.get(network_id)

        # Remove the network via Docker SDK
        docker_network.remove()

        # Delete from DB
        network.delete()

        return Response({'message': 'Docker network deleted successfully.'}, status=status.HTTP_200_OK)

    except Network.DoesNotExist:
        return Response({'message': 'Network not found.'}, status=status.HTTP_404_NOT_FOUND)

    except docker.errors.NotFound:
        network.delete()  # Clean DB if network exists in DB but not in Docker
        return Response({'message': 'Docker network not found. Removed from DB.'}, status=status.HTTP_200_OK)

    except docker.errors.APIError as e:
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def connect_container_to_network(request):
    try:
        network_id = request.data.get('network_id')
        container_id = request.data.get('container_id')

        print(f"Connect request - network_id: {network_id}, container_id: {container_id}")

        if not network_id or not container_id:
            return Response({'message': 'network_id and container_id are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the Network and Container from DB
        network = Network.objects.get(id=network_id)
        container = ContainerRecord.objects.get(container_id=container_id)

        print(f"Found network: {network.name} (ID: {network.id})")
        print(f"Found container: {container.name} (ID: {container.container_id})")

        # Ensure both belong to the same host
        if network.host != container.host:
            return Response({'message': 'Container and network must belong to the same host.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Connect to Docker host
        client = docker.DockerClient(base_url=network.host.docker_api_url)

        # Get Docker objects - try by ID first, then by name
        try:
            print(f"Trying to get network by ID: {network_id}")
            docker_network = client.networks.get(network_id)
            print(f"Successfully got network by ID: {docker_network.name}")
        except docker.errors.NotFound:
            print(f"Network not found by ID, trying by name: {network.name}")
            try:
                docker_network = client.networks.get(network.name)
                print(f"Successfully got network by name: {docker_network.name}")
            except docker.errors.NotFound:
                print(f"Network not found by name either: {network.name}")
                return Response({'message': f'Network {network.name} not found in Docker. It may have been deleted.'},
                                status=status.HTTP_404_NOT_FOUND)
        
        try:
            docker_container = client.containers.get(container_id)
            print(f"Successfully got container: {docker_container.name}")
        except docker.errors.NotFound:
            return Response({'message': f'Container {container_id} not found in Docker.'},
                            status=status.HTTP_404_NOT_FOUND)

        # Check if container is already connected to this network
        container_networks = docker_container.attrs['NetworkSettings']['Networks']
        print(f"Container networks: {list(container_networks.keys())}")
        if network.name in container_networks:
            return Response({'message': f'Container {container.name} is already connected to network {network.name}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Connect container to network
        print(f"Connecting container {container.name} to network {network.name}")
        docker_network.connect(docker_container)
        print("Connection successful")

        return Response({'message': f'Container {container.name} connected to network {network.name} successfully.'},
                        status=status.HTTP_200_OK)

    except Network.DoesNotExist:
        print(f"Network not found in DB: {network_id}")
        return Response({'message': 'Network not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ContainerRecord.DoesNotExist:
        print(f"Container not found in DB: {container_id}")
        return Response({'message': 'Container not found.'}, status=status.HTTP_404_NOT_FOUND)
    except docker.errors.APIError as e:
        print(f"Docker API error: {e}")
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Unexpected error: {e}")
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def disconnect_container_from_network(request):
    try:
        network_id = request.data.get('network_id')
        container_id = request.data.get('container_id')

        if not network_id or not container_id:
            return Response({'message': 'network_id and container_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve network and container
        network = Network.objects.get(id=network_id)
        container = ContainerRecord.objects.get(container_id=container_id)
        host = network.host

        # Connect to Docker host
        client = docker.DockerClient(base_url=host.docker_api_url)

        # Get Docker network and disconnect container - try by ID first, then by name
        try:
            docker_network = client.networks.get(network_id)
        except docker.errors.NotFound:
            try:
                docker_network = client.networks.get(network.name)
            except docker.errors.NotFound:
                # Network doesn't exist in Docker, but exists in our DB
                # This is the case we're trying to handle
                return Response({
                    'message': f'Network {network.name} not found in Docker. It may have been deleted externally. Use the cleanup function to handle this.',
                    'network_deleted': True,
                    'suggestion': 'Try using the cleanup button to remove invalid network references.'
                }, status=status.HTTP_404_NOT_FOUND)

        docker_network.disconnect(container_id, force=True)

        return Response({'message': f'Container {container.name} disconnected from network {network.name}'}, status=status.HTTP_200_OK)

    except Network.DoesNotExist:
        return Response({'message': 'Network not found'}, status=status.HTTP_404_NOT_FOUND)
    except ContainerRecord.DoesNotExist:
        return Response({'message': 'Container not found'}, status=status.HTTP_404_NOT_FOUND)
    except docker.errors.APIError as e:
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_networks_by_host(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id)
    except DockerHost.DoesNotExist:
        return Response({'message': 'Host not found'}, status=status.HTTP_404_NOT_FOUND)

    networks = Network.objects.filter(host=host)
    serializer = NetworkSerializer(networks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def container_connected_networks(request, host_id, container_id):
    try:
        host = DockerHost.objects.get(id=host_id)
        container_record = ContainerRecord.objects.get(container_id=container_id)

        if container_record.host != host:
            return Response({'message': 'Container does not belong to the given host.'},
                            status=status.HTTP_400_BAD_REQUEST)

        client = docker.DockerClient(base_url=host.docker_api_url)
        container = client.containers.get(container_id)

        networks = container.attrs['NetworkSettings']['Networks']
        connected_networks = []
        for name in networks.keys():
            try:
                network = client.networks.get(name)
                connected_networks.append({
                    'id': network.id,
                    'name': name,
                    'details': networks[name]
                })
            except docker.errors.NotFound:
                connected_networks.append({
                    'id': None,
                    'name': name,
                    'details': networks[name]
                })

        return Response(connected_networks, status=status.HTTP_200_OK)

    except DockerHost.DoesNotExist:
        return Response({'message': 'Host not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ContainerRecord.DoesNotExist:
        return Response({'message': 'Container not found.'}, status=status.HTTP_404_NOT_FOUND)
    except docker.errors.APIError as e:
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cleanup_container_networks(request, host_id, container_id):
    """
    Clean up invalid network references for a container.
    This handles cases where networks exist in the container's network settings
    but no longer exist in Docker.
    """
    try:
        host = DockerHost.objects.get(id=host_id)
        container_record = ContainerRecord.objects.get(container_id=container_id)

        if container_record.host != host:
            return Response({'message': 'Container does not belong to the given host.'},
                            status=status.HTTP_400_BAD_REQUEST)

        client = docker.DockerClient(base_url=host.docker_api_url)
        container = client.containers.get(container_id)

        networks = container.attrs['NetworkSettings']['Networks']
        cleaned_networks = []
        removed_networks = []

        for name in networks.keys():
            try:
                # Try to get the network from Docker
                network = client.networks.get(name)
                cleaned_networks.append({
                    'id': network.id,
                    'name': name,
                    'details': networks[name]
                })
            except docker.errors.NotFound:
                # Network doesn't exist in Docker, mark for removal
                removed_networks.append(name)
                # Note: We can't disconnect from a non-existent network
                # The container's network settings will still show it until the container is restarted
                # or the Docker daemon is restarted

        return Response({
            'message': f'Network cleanup completed. Found {len(removed_networks)} invalid network references. Container restart may be needed to fully clear references.',
            'removed_networks': removed_networks,
            'cleaned_networks': cleaned_networks,
            'requires_restart': len(removed_networks) > 0
        }, status=status.HTTP_200_OK)

    except DockerHost.DoesNotExist:
        return Response({'message': 'Host not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ContainerRecord.DoesNotExist:
        return Response({'message': 'Container not found.'}, status=status.HTTP_404_NOT_FOUND)
    except docker.errors.APIError as e:
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_exec_session(request, host_id, container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host_id=host_id)
        
        # Permission check
        if not (request.user.is_admin() or request.user == container.created_by):
            return Response({"error": "Permission denied"}, status=403)
        
        client = docker.DockerClient(base_url=container.host.docker_api_url)
        exec_instance = client.api.exec_create(
            container=container_id,
            cmd="/bin/sh",
            tty=True,
            stdin=True
        )
        return Response({"exec_id": exec_instance['Id']}, status=201)
    
    except (ContainerRecord.DoesNotExist, DockerHost.DoesNotExist):
        return Response({"error": "Resource not found"}, status=404)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_volumes_by_host(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id)

        # Check if user has access
        if not (request.user.is_admin() or request.user == host.owner):
            return Response({'message': 'Permission denied'}, status=403)

        volumes = Volume.objects.filter(host=host)
        serializer = VolumeSerializer(volumes, many=True)
        return Response(serializer.data)
    except DockerHost.DoesNotExist:
        return Response({'message': 'Docker host not found'}, status=404)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_volume(request, host_id):
    try:
        host = DockerHost.objects.get(id=host_id)

        if not (request.user.is_admin() or request.user == host.owner):
            return Response({'message': 'Permission denied'}, status=403)

        name = request.data.get('name')
        labels = request.data.get('labels', {})
        driver = request.data.get('driver', 'local')

        if not name:
            return Response({'message': 'Volume name required'}, status=400)

        client = docker.DockerClient(base_url=host.docker_api_url)
        docker_volume = client.volumes.create(name=name, driver=driver, labels=labels)

        volume = Volume.objects.create(
            name=docker_volume.name,
            driver=docker_volume.attrs.get('Driver', 'local'),
            mountpoint=docker_volume.attrs.get('Mountpoint'),
            labels=docker_volume.attrs.get('Labels', {}),
            host=host
        )

        serializer = VolumeSerializer(volume)
        return Response(serializer.data, status=201)

    except DockerHost.DoesNotExist:
        return Response({'message': 'Docker host not found'}, status=404)
    except docker.errors.APIError as e:
        return Response({'message': f'Docker API error: {str(e)}'}, status=400)
    except Exception as e:
        return Response({'message': f'Error: {str(e)}'}, status=500)
    
@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_volume(request, volume_id):
    try:
        volume = Volume.objects.get(id=volume_id)
        client = docker.DockerClient(base_url=volume.host.docker_api_url)

        docker_volume= client.volumes.get(volume.name)
        docker_volume.remove()

        volume.delete()

        return Response({'message': 'Docker volume deleted successfully.'}, status=status.HTTP_200_OK)

    except Volume.DoesNotExist:
        return Response({'message': 'Volume not found.'}, status=status.HTTP_404_NOT_FOUND)

    except docker.errors.NotFound:
        volume.delete()  
        return Response({'message': 'Docker volume not found. Removed from DB.'}, status=status.HTTP_200_OK)

    except docker.errors.APIError as e:
        return Response({'message': f'Docker error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_container_volume_bindings(request, host_id, container_id):
    try:
        container = ContainerRecord.objects.get(container_id=container_id, host=DockerHost.objects.get(id=host_id))
        
        # Get the Docker container to check its current volume mounts
        client = docker.DockerClient(base_url=container.host.docker_api_url)
        docker_container = client.containers.get(container_id)
        
        # Get container's current volume mounts
        mounts = docker_container.attrs.get('Mounts', [])
        
        # Get associated volumes from our database
        db_volumes = container.volumes.all()
        
        volume_info = []
        for mount in mounts:
            volume_name = mount.get('Name')
            mount_point = mount.get('Destination')
            mode = mount.get('RW', True)  # Read/Write by default
            
            # Find corresponding volume in our database
            db_volume = db_volumes.filter(name=volume_name).first()
            
            volume_info.append({
                'volume_name': volume_name,
                'mount_point': mount_point,
                'mode': 'rw' if mode else 'ro',
                'in_database': db_volume is not None,
                'volume_id': db_volume.id if db_volume else None
            })
        
        return Response({
            'container_id': container_id,
            'container_name': container.name,
            'volume_bindings': volume_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def host_details(request, host_id):
    """
    Returns host details and stats: number of containers, volumes, and networks associated with the host.
    """
    try:
        host = DockerHost.objects.get(id=host_id)
        containers_count = ContainerRecord.objects.filter(host=host).count()
        volumes_count = Volume.objects.filter(host=host).count()
        networks_count = Network.objects.filter(host=host).count()
        # Optionally, add images count if you track images in DB

        serializer = DockerHostSerializer(host)
        return Response({
            "host": serializer.data,
            "stats": {
                "containers": containers_count,
                "volumes": volumes_count,
                "networks": networks_count
            }
        }, status=200)
    except DockerHost.DoesNotExist:
        return Response({"message": "Host not found"}, status=404)
