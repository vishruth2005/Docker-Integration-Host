from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    def __str__(self):
        return self.username

    def is_admin(self):
        return self.groups.filter(name='admin').exists()

    def is_developer(self):
        return self.groups.filter(name='developer').exists()

    def is_viewer(self):
        return self.groups.filter(name='viewer').exists()