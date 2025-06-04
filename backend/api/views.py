from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework import status
from .serializers import UserRegistrationSerializer, UserLoginSerializer, CustomTokenObtainPairSerializer, ContainerRecordSerializer
from .models import ContainerRecord
from django.contrib.auth.models import Group, Permission
from rest_framework_simplejwt.tokens import RefreshToken
import docker
from django.db.models import Q

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