from django.urls import path
from .views import home_view, register_user, login_user

urlpatterns = [
    path('', home_view, name='home'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login')
]