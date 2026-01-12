from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("api/admin/", admin.site.urls), # Add api/ prefix here
    path("api/", include("api.urls")),    # Add api/ prefix here
]
