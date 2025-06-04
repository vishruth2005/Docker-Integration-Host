from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import docker

from api.models import ContainerRecord, DockerHost

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        roles = list(user.groups.values_list('name', flat=True))
        if roles:
            token['role'] = roles[0]  # If user has multiple roles, take the first one
        return token

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']
        user = get_user_model()
        new_user = user(username=username, email=email)
        new_user.set_password(password)
        new_user.save()
        return new_user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Must include username and password.')
        
        return data
    
class DockerHostSerializer(serializers.ModelSerializer):
    class Meta:
        model = DockerHost
        fields = [
            'id', 'host_name', 'host_ip', 'docker_api_url', 'port',
            'connection_protocol', 'auth_type', 'status', 'description',
            'operating_system', 'docker_version', 'total_cpu_cores',
            'total_memory_mb', 'running_containers_count', 'total_images_count',
            'created_at', 'updated_at', 'labels'
        ]
        read_only_fields = ['created_at', 'updated_at', 'connection_protocol', 'status', 'host_ip', 'port']

    def create(self, validated_data):
        user = self.context['request'].user
        return DockerHost.objects.create(owner=user, **validated_data)

    def validate(self, data):
        if data['connection_protocol'] == 'tcp' and not data.get('port'):
            raise serializers.ValidationError("Port is required for TCP connections")
        if data['auth_type'] == 'tls' and not (data.get('tls_cert') and data.get('tls_key')):
            raise serializers.ValidationError("TLS certificate and key are required for TLS authentication")
        return data

class ContainerRecordSerializer(serializers.ModelSerializer):
    host = DockerHostSerializer(read_only=True)
    created_by = serializers.SerializerMethodField()
    editable_by = serializers.SerializerMethodField()
    viewable_by = serializers.SerializerMethodField()

    class Meta:
        model = ContainerRecord
        fields = [
            'id',
            'container_id',
            'name',
            'image',
            'status',
            'state',
            'created_at',
            'restarted_count',
            'internal_ports',
            'port_bindings',
            'host',
            'created_by',
            'editable_by',
            'viewable_by',
            'last_updated',
            'is_active',
        ]
        read_only_fields = [
            'created_at',
            'created_by',
            'last_updated',
        ]

    def get_created_by(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_editable_by(self, obj):
        return [user.username for user in obj.editable_by.all()]

    def get_viewable_by(self, obj):
        return [user.username for user in obj.viewable_by.all()]