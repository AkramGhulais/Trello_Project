import os
import sys
import django

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

# استيراد النماذج
from organizations.models import Organization
from users.models import User
from projects.models import Project
from tasks.models import Task
from django.db import transaction

# تنفيذ الإصلاحات داخل معاملة قاعدة بيانات
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

    # 3. التأكد من وجود مستخدم أدمن واحد على الأقل
    admin_exists = User.objects.filter(is_superuser=True).exists()
    if not admin_exists:
        print("لا يوجد مستخدم أدمن. جاري إنشاء مستخدم أدمن افتراضي...")
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123",
            organization=default_org,
            is_admin=True
        )
        print(f"تم إنشاء مستخدم أدمن جديد: {admin_user.username}")
    else:
        print("يوجد مستخدم أدمن بالفعل")

print("\nتم إصلاح قاعدة البيانات بنجاح!")
