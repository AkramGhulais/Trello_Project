import os
import sys
import django
import json

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

# استيراد النماذج والمكتبات اللازمة
from django.test.client import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from organizations.models import Organization
from projects.models import Project
from django.urls import reverse
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_tokens_for_user(user):
    """الحصول على رموز JWT للمستخدم"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def test_api():
    """اختبار واجهات API"""
    print("=== اختبار واجهات API ===")
    
    # إنشاء منظمة افتراضية
    default_org, created = Organization.objects.get_or_create(name="منظمة افتراضية")
    
    # إنشاء مستخدم اختبار
    username = "testuser"
    password = "testpassword123"
    
    try:
        user = User.objects.get(username=username)
        print(f"تم العثور على مستخدم الاختبار: {username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username=username,
            password=password,
            email="test@example.com",
            organization=default_org,
            is_admin=True
        )
        print(f"تم إنشاء مستخدم اختبار جديد: {username}")
    
    # التأكد من أن المستخدم لديه منظمة
    if not user.organization:
        user.organization = default_org
        user.save()
        print(f"تم تعيين المنظمة الافتراضية للمستخدم: {username}")
    
    # الحصول على رموز JWT
    tokens = get_tokens_for_user(user)
    print(f"تم إنشاء رموز JWT للمستخدم: {username}")
    
    # إنشاء عميل API
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
    
    # اختبار الحصول على المستخدم الحالي
    response = client.get('/api/users/me/')
    print("\n=== اختبار الحصول على المستخدم الحالي ===")
    print(f"الحالة: {response.status_code}")
    if response.status_code == 200:
        print(f"البيانات: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
    else:
        print(f"الخطأ: {response.content.decode()}")
    
    # اختبار إنشاء مشروع جديد
    project_data = {
        'title': 'مشروع اختبار',
        'description': 'هذا مشروع اختبار تم إنشاؤه بواسطة البرنامج'
    }
    
    response = client.post('/api/projects/', project_data, format='json')
    print("\n=== اختبار إنشاء مشروع جديد ===")
    print(f"الحالة: {response.status_code}")
    if response.status_code == 201:
        print(f"تم إنشاء المشروع بنجاح!")
        print(f"البيانات: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
        project_id = response.data['id']
    else:
        print(f"فشل إنشاء المشروع!")
        print(f"الخطأ: {response.content.decode()}")
        project_id = None
    
    # اختبار الحصول على قائمة المشاريع
    response = client.get('/api/projects/')
    print("\n=== اختبار الحصول على قائمة المشاريع ===")
    print(f"الحالة: {response.status_code}")
    if response.status_code == 200:
        print(f"عدد المشاريع: {len(response.data)}")
    else:
        print(f"الخطأ: {response.content.decode()}")
    
    # اختبار إضافة مهمة إلى المشروع
    if project_id:
        task_data = {
            'title': 'مهمة اختبار',
            'description': 'هذه مهمة اختبار تم إنشاؤها بواسطة البرنامج',
            'status': 'todo'
        }
        
        response = client.post(f'/api/projects/{project_id}/add_task/', task_data, format='json')
        print("\n=== اختبار إضافة مهمة إلى المشروع ===")
        print(f"الحالة: {response.status_code}")
        if response.status_code == 201:
            print(f"تم إنشاء المهمة بنجاح!")
            print(f"البيانات: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
        else:
            print(f"فشل إنشاء المهمة!")
            print(f"الخطأ: {response.content.decode()}")
    
    print("\n=== اكتمل اختبار واجهات API ===")

if __name__ == "__main__":
    test_api()
