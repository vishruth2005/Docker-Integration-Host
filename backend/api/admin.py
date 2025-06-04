from django.contrib import admin
from .models import DockerHost, ContainerRecord

# Register your models here.
admin.site.register(DockerHost)
admin.site.register(ContainerRecord)
