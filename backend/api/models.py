from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import docker
from rest_framework.response import Response
import time

class CustomUser(AbstractUser):
    def __str__(self):
        return self.username

    def is_admin(self):
        return self.groups.filter(name='admin').exists()

    def is_developer(self):
        return self.groups.filter(name='developer').exists()

    def is_viewer(self):
        return self.groups.filter(name='viewer').exists()

class ContainerRecord(models.Model):
    container_id = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    image = models.CharField(max_length=255)
    status = models.CharField(max_length=100, default='created')  # e.g., "running", "exited", etc.
    state = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField()
    restarted_count = models.IntegerField(default=0)

    # Networking
    internal_ports = models.JSONField(blank=True, null=True)  # {"80/tcp": {}}
    port_bindings = models.JSONField(blank=True, null=True)   # {"80/tcp": [{"HostPort": "8080"}]}

    host = models.ForeignKey('DockerHost', on_delete=models.CASCADE, related_name='containers')

    created_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='created_containers'
    )
    editable_by = models.ManyToManyField(
        CustomUser, related_name='editable_containers', blank=True
    )
    viewable_by = models.ManyToManyField(
        CustomUser, related_name='viewable_containers', blank=True
    )

    # Metadata
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def start(self):
        try:
            client = docker.DockerClient(base_url=self.host.docker_api_url)
            container = client.containers.get(self.container_id)
            container.start()
            self.status = 'running'
            self.save()
        except Exception as e:
            raise Exception(f"Failed to start container: {e}")
        
    def stop(self):
        try:
            client = docker.DockerClient(base_url=self.host.docker_api_url)
            container = client.containers.get(self.container_id)
            container.stop()
            self.status = 'stopped'
            self.save()
        except Exception as e:
            raise Exception(f"Failed to stop container: {e}")
        
    def get_logs(self):
        try:
            client = docker.DockerClient(base_url=self.host.docker_api_url)
            container = client.containers.get(self.container_id)
            logs = container.logs()
            return logs
        except Exception as e:
            raise Exception(f"Failed to get logs: {e}")

    def stats(self, stream=False):
        try:
            import docker
            client = docker.DockerClient(base_url=self.host.docker_api_url)
            container = client.containers.get(self.container_id)

            # Always stream once to get valid stats
            raw_stats = container.stats(stream=stream)

            if raw_stats["read"].startswith("0001-01-01"):
                raise Exception("Container stats not ready or container is not running.")

            # === CPU TIME (user + kernel) ===
            cpu_stats = raw_stats["cpu_stats"]
            cpu_user = cpu_stats["cpu_usage"]["usage_in_usermode"]
            cpu_kernel = cpu_stats["cpu_usage"]["usage_in_kernelmode"]
            cpu_total_time_sec = (cpu_user + cpu_kernel) / 1e9  # Convert nanoseconds to seconds

            # === MEMORY ===
            mem_usage = raw_stats["memory_stats"]["usage"]
            mem_limit = raw_stats["memory_stats"]["limit"]

            # === NETWORK ===
            net = raw_stats["networks"]["eth0"]
            rx_bytes = net["rx_bytes"]
            tx_bytes = net["tx_bytes"]
            network_rx_mb = round(rx_bytes / (1024 ** 2), 2)
            network_tx_mb = round(tx_bytes / (1024 ** 2), 2)

            # === PIDs ===
            pids = raw_stats["pids_stats"]["current"]

            # === Final Structured Result ===
            result = {
                "container_id": raw_stats["id"][:12],
                "name": raw_stats["name"].lstrip("/"),
                "cpu_total_time_sec": round(cpu_total_time_sec, 2),
                "memory_usage_mb": round(mem_usage / (1024 ** 2), 2),
                "memory_limit_mb": round(mem_limit / (1024 ** 2), 2),
                "pids": pids,
                "network_rx_mb": network_rx_mb,
                "network_tx_mb": network_tx_mb,
                "timestamp": raw_stats["read"]
            }

            return result

        except KeyError as ke:
            raise Exception(f"Missing expected stat field: {ke}")
        except Exception as e:
            raise Exception(f"Failed to get stats: {e}")


    def __str__(self):
        return f"{self.name} ({self.container_id[:12]})"

class DockerHost(models.Model):
    AUTH_CHOICES = [
        ('none', 'None'),
        ('tls', 'TLS'),
        ('ssh', 'SSH'),
    ]

    CONNECTION_PROTOCOLS = [
        ('tcp', 'TCP'),
        ('unix', 'Unix Socket'),
        ('ssh', 'SSH'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='docker_hosts')
    host_name = models.CharField(max_length=100)
    host_ip = models.GenericIPAddressField()
    docker_api_url = models.CharField(max_length=255)  # e.g. tcp://192.168.1.10:2376
    port = models.PositiveIntegerField(null=True, blank=True)
    connection_protocol = models.CharField(max_length=10, choices=CONNECTION_PROTOCOLS, default='tcp')

    auth_type = models.CharField(max_length=10, choices=AUTH_CHOICES, default='none')

    # TLS Authentication fields
    tls_cert = models.TextField(blank=True, null=True)
    tls_key = models.TextField(blank=True, null=True)
    tls_ca_cert = models.TextField(blank=True, null=True)

    # SSH Authentication fields
    ssh_username = models.CharField(max_length=50, blank=True, null=True)
    ssh_private_key = models.TextField(blank=True, null=True)
    ssh_password = models.CharField(max_length=100, blank=True, null=True)

    # API token (if required)
    api_token = models.CharField(max_length=255, blank=True, null=True)

    labels = models.CharField(max_length=255, blank=True, help_text="Comma separated tags")
    description = models.TextField(blank=True)

    operating_system = models.CharField(max_length=100, blank=True, null=True)
    docker_version = models.CharField(max_length=50, blank=True, null=True)

    status = models.CharField(max_length=50, default='inactive')
    last_seen_at = models.DateTimeField(blank=True, null=True)

    total_cpu_cores = models.PositiveIntegerField(blank=True, null=True)
    total_memory_mb = models.PositiveIntegerField(blank=True, null=True)
    running_containers_count = models.PositiveIntegerField(blank=True, null=True)
    total_images_count = models.PositiveIntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'host_ip', 'port')

    def save(self, *args, **kwargs):
        # Auto-generate docker_api_url if not provided
        if not self.docker_api_url and self.host_ip and self.port:
            self.docker_api_url = f"{self.connection_protocol}://{self.host_ip}:{self.port}"
        super().save(*args, **kwargs)

    def test_connection(self):
        try:
            client = docker.DockerClient(base_url=self.docker_api_url)
            client.ping()
            self.status = 'active'
            return True
        except Exception:
            self.status = 'inactive'
            return False

    def _str_(self):
        return f"{self.host_name} ({self.host_ip})"
    
class Network(models.Model):
    NETWORK_DRIVER_CHOICES = [
        ('bridge', 'Bridge'),
        ('overlay', 'Overlay'),
        ('host', 'Host'),
        ('macvlan', 'Macvlan'),
        ('none', 'None'),
    ]

    id = models.CharField(primary_key=True, max_length=64)  # Docker network ID
    name = models.CharField(max_length=100, unique=True)
    driver = models.CharField(max_length=20, choices=NETWORK_DRIVER_CHOICES, default='bridge')
    scope = models.CharField(max_length=50, default='local')
    created_at = models.DateTimeField(auto_now_add=True)
    internal = models.BooleanField(default=False)
    attachable = models.BooleanField(default=False)
    ingress = models.BooleanField(default=False)
    host = models.ForeignKey(DockerHost, on_delete=models.CASCADE, related_name='networks')

    def __str__(self):
        return f"{self.name} ({self.driver})"
    
class Volume(models.Model):
    name = models.CharField(max_length=255, unique=True)
    driver = models.CharField(max_length=100, default='local')
    mountpoint = models.CharField(max_length=255, blank=True, null=True)
    host = models.ForeignKey('DockerHost', on_delete=models.CASCADE, related_name='volumes')
    created_at = models.DateTimeField(auto_now_add=True)
    labels = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name