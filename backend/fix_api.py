import os
import sys
import django

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

# استيراد النماذج والمكتبات اللازمة
from django.db import transaction
from organizations.models import Organization
from users.models import User
from projects.models import Project
from projects.serializers import ProjectSerializer
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest

def fix_api():
    """إصلاح مشاكل الـ API والباك إند"""
    print("=== بدء إصلاح الـ API والباك إند ===")
    
    with transaction.atomic():
        # 1. إنشاء منظمة افتراضية إذا لم تكن موجودة
        default_org, created = Organization.objects.get_or_create(name="منظمة افتراضية")
        if created:
            print("تم إنشاء منظمة افتراضية جديدة")
        else:
            print("المنظمة الافتراضية موجودة بالفعل")
        
        # 2. التأكد من أن جميع المستخدمين لديهم منظمة
        users_without_org = User.objects.filter(organization=None)
        if users_without_org.exists():
            print(f"يوجد {users_without_org.count()} مستخدم بدون منظمة. جاري تعيين المنظمة الافتراضية لهم...")
            for user in users_without_org:
                user.organization = default_org
                user.save()
                print(f"تم تعيين المنظمة الافتراضية للمستخدم: {user.username}")
        else:
            print("جميع المستخدمين لديهم منظمة")
        
        # 3. التأكد من وجود مستخدم واحد على الأقل
        if User.objects.count() == 0:
            print("لا يوجد مستخدمين. جاري إنشاء مستخدم افتراضي...")
            user = User.objects.create_user(
                username="user",
                email="user@example.com",
                password="user123",
                organization=default_org
            )
            print(f"تم إنشاء مستخدم جديد: {user.username}")
        else:
            print(f"يوجد {User.objects.count()} مستخدم في النظام")
        
        # 4. التحقق من صحة نموذج المشروع والـ serializer
        print("\n=== التحقق من صحة نموذج المشروع والـ serializer ===")
        
        # إنشاء مستخدم اختبار
        test_user = User.objects.first()
        if not test_user.organization:
            test_user.organization = default_org
            test_user.save()
            print(f"تم تعيين المنظمة الافتراضية للمستخدم: {test_user.username}")
        
        # إنشاء مشروع اختبار
        project_data = {
            'title': 'مشروع اختبار',
            'description': 'هذا مشروع اختبار تم إنشاؤه بواسطة البرنامج'
        }
        
        # إنشاء طلب وهمي
        factory = APIRequestFactory()
        request = factory.post('/api/projects/', project_data)
        request.user = test_user
        
        # إنشاء serializer واختباره
        serializer = ProjectSerializer(data=project_data, context={'request': request})
        if serializer.is_valid():
            print("Serializer صالح!")
            print(f"البيانات المتحقق منها: {serializer.validated_data}")
            
            # حفظ المشروع
            try:
                project = serializer.save(owner=test_user, organization=test_user.organization)
                print(f"تم إنشاء المشروع بنجاح! ID: {project.id}, العنوان: {project.title}")
            except Exception as e:
                print(f"خطأ في حفظ المشروع: {str(e)}")
        else:
            print(f"Serializer غير صالح! الأخطاء: {serializer.errors}")
        
        # 5. التحقق من إعدادات CORS
        from django.conf import settings
        print("\n=== التحقق من إعدادات CORS ===")
        print(f"CORS_ALLOW_ALL_ORIGINS: {settings.CORS_ALLOW_ALL_ORIGINS}")
        print(f"CORS_ALLOW_CREDENTIALS: {settings.CORS_ALLOW_CREDENTIALS}")
        print(f"CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
        
        # 6. التحقق من إعدادات REST Framework
        print("\n=== التحقق من إعدادات REST Framework ===")
        print(f"DEFAULT_AUTHENTICATION_CLASSES: {settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']}")
        print(f"DEFAULT_PERMISSION_CLASSES: {settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']}")
    
    print("\n=== اكتمل إصلاح الـ API والباك إند ===")

if __name__ == "__main__":
    fix_api()
