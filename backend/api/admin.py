from django.contrib import admin
from .models import DockerHost, ContainerRecord, Network

# Register your models here.
admin.site.register(DockerHost)
admin.site.register(ContainerRecord)
admin.site.register(Network)
