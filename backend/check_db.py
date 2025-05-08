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

# طباعة معلومات قاعدة البيانات
print("=== معلومات قاعدة البيانات ===")
print(f"عدد المنظمات: {Organization.objects.count()}")
print(f"عدد المستخدمين: {User.objects.count()}")
print(f"عدد المشاريع: {Project.objects.count()}")
print(f"عدد المهام: {Task.objects.count()}")

# طباعة تفاصيل المنظمات
print("\n=== المنظمات ===")
for org in Organization.objects.all():
    print(f"ID: {org.id}, الاسم: {org.name}")

# طباعة تفاصيل المستخدمين
print("\n=== المستخدمين ===")
for user in User.objects.all():
    org_name = user.organization.name if user.organization else "لا يوجد"
    print(f"ID: {user.id}, اسم المستخدم: {user.username}, المنظمة: {org_name}, أدمن: {user.is_admin}")

# طباعة تفاصيل المشاريع
print("\n=== المشاريع ===")
for project in Project.objects.all():
    print(f"ID: {project.id}, العنوان: {project.title}, المالك: {project.owner.username}, المنظمة: {project.organization.name}")

# إنشاء منظمة افتراضية إذا لم تكن موجودة
default_org, created = Organization.objects.get_or_create(name="منظمة افتراضية")
if created:
    print("\nتم إنشاء منظمة افتراضية جديدة")
else:
    print("\nالمنظمة الافتراضية موجودة بالفعل")

# التأكد من أن جميع المستخدمين لديهم منظمة
users_without_org = User.objects.filter(organization=None)
if users_without_org.exists():
    print(f"\nيوجد {users_without_org.count()} مستخدم بدون منظمة. جاري تعيين المنظمة الافتراضية لهم...")
    for user in users_without_org:
        user.organization = default_org
        user.save()
        print(f"تم تعيين المنظمة الافتراضية للمستخدم: {user.username}")
else:
    print("\nجميع المستخدمين لديهم منظمة")

print("\n=== اكتمل التحقق من قاعدة البيانات ===")
