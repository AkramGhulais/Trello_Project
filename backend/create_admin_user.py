import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from organizations.models import Organization
from users.models import User

# إنشاء منظمة إذا لم تكن موجودة
try:
    org = Organization.objects.get(slug='sofaa')
    print(f'تم العثور على المنظمة: {org.id}')
except Organization.DoesNotExist:
    org = Organization(name='شركة سوفا', slug='sofaa')
    org.save()
    print(f'تم إنشاء المنظمة بنجاح: {org.id}')

# إنشاء مستخدم مسؤول جديد
username = 'admin123'
password = 'Admin123!'

try:
    user = User.objects.get(username=username)
    print(f'المستخدم موجود بالفعل: {user.username}')
    # تحديث كلمة المرور
    user.password = make_password(password)
    user.save()
    print(f'تم تحديث كلمة المرور للمستخدم: {user.username}')
except User.DoesNotExist:
    # إنشاء مستخدم مسؤول جديد
    user = User(
        username=username,
        email='admin123@example.com',
        password=make_password(password),
        is_admin=True,
        is_staff=True,
        is_superuser=True,
        organization=org
    )
    user.save()
    print(f'تم إنشاء المستخدم المسؤول بنجاح: {user.username}')

print(f'\nبيانات تسجيل الدخول:')
print(f'اسم المستخدم: {username}')
print(f'كلمة المرور: {password}')
