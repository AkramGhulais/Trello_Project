"""
URL configuration for trello_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from organizations.views import OrganizationViewSet, PublicOrganizationsView
from users.views import UserViewSet, SignupView, current_user
from projects.views import ProjectViewSet
from tasks.views import TaskViewSet, TaskCommentViewSet

# إنشاء موجه API
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'users', UserViewSet, basename='user')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', TaskCommentViewSet, basename='comment')

# صفحة ترحيب بسيطة
def welcome(request):
    return JsonResponse({
        'message': 'مرحباً بك في واجهة برمجة تطبيق Trello',
        'endpoints': {
            'admin': '/admin/',
            'login': '/api/login/',
            'signup': '/api/signup/',
            'token_refresh': '/api/token/refresh/',
            'current_user': '/api/users/me/',
            'api_root': '/api/'
        }
    })

urlpatterns = [
    path('', welcome, name='welcome'),
    path('admin/', admin.site.urls),
    
    # وجهات API للمصادقة
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/users/me/', current_user, name='current_user'),
    path('api/public/organizations/', PublicOrganizationsView.as_view(), name='public_organizations'),
    
    # وجهات API للموارد
    path('api/', include(router.urls)),
]
