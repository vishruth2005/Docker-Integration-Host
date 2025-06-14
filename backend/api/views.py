from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework import status
from .serializers import UserRegistrationSerializer, UserLoginSerializer, CustomTokenObtainPairSerializer, ContainerRecordSerializer, DockerHostSerializer
from .models import ContainerRecord, DockerHost
from django.contrib.auth.models import Group, Permission
from rest_framework_simplejwt.tokens import RefreshToken
import docker
from django.db.models import Q
from django.utils import timezone


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
    containers = ContainerRecord.objects.all()
    serializer = ContainerRecordSerializer(containers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsDeveloper])
def developer_only_view(request):
    containers = ContainerRecord.objects.filter(
        Q(created_by=request.user) |
        Q(editable_by=request.user)
    ).distinct()
    serializer = ContainerRecordSerializer(containers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsViewer])
def viewer_only_view(request):
    containers = ContainerRecord.objects.filter(
        Q(viewable_by=request.user)
    ).distinct()
    serializer = ContainerRecordSerializer(containers, many=True)
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

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_docker_hosts(request):
    user_hosts = DockerHost.objects.filter(owner=request.user)
    serializer = DockerHostSerializer(user_hosts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_container(request):
    try:
        host_id = request.data.get('host_id')
        if not host_id:
            return Response({
                'message': 'host_id is required in the request data'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            host = DockerHost.objects.get(id=host_id)
        except DockerHost.DoesNotExist:
            return Response({
                'message': 'Docker host not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if not (request.user.is_admin() or request.user == host.owner):
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        # Required fields
        required_fields = ['image', 'name']
        if not all(field in request.data for field in required_fields):
            return Response({
                'message': 'Missing required fields: image and name are required'
            }, status=status.HTTP_400_BAD_REQUEST)

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

        # Optional Docker configuration
        container_config = {
            'name': request.data['name'],
            'image': request.data['image'],
            'ports': request.data.get('ports', {}),
            'environment': request.data.get('environment', {}),
            'volumes': request.data.get('volumes', []),
            'command': request.data.get('command', None)
        }

        try:
            # Create container in Docker
            client = docker.DockerClient(base_url=f"{host.docker_api_url}")
            docker_container = client.containers.create(**container_config)

            # Update container record with actual container ID
            container_data['container_id'] = docker_container.id
            container_data['status'] = 'created'

            # Save container record
            container = ContainerRecord.objects.create(**container_data)

            # Add permissions
            if 'viewable_by' in request.data:
                container.viewable_by.add(*request.data['viewable_by'])
            if 'editable_by' in request.data:
                container.editable_by.add(*request.data['editable_by'])

            # Start container if requested
            if request.data.get('start', False):
                docker_container.start()
                container.status = 'running'
                container.save()

            serializer = ContainerRecordSerializer(container)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except docker.errors.APIError as e:
            return Response({
                'message': f'Docker API error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'message': f'Error creating container: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'message': f'Unexpected error: {str(e)}'
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