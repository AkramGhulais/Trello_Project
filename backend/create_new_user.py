import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from organizations.models import Organization
from users.models import User

# الحصول على المنظمة
org = Organization.objects.get(slug='sofaa')
print(f'تم العثور على المنظمة: {org.id}')

# إنشاء مستخدم جديد
username = 'testuser'
password = 'Test1234!'

# التحقق من وجود المستخدم أولاً
try:
    user = User.objects.get(username=username)
    print(f'المستخدم موجود بالفعل: {user.username}')
    # تحديث كلمة المرور
    user.set_password(password)
    user.save()
    print(f'تم تحديث كلمة المرور للمستخدم: {user.username}')
except User.DoesNotExist:
    # إنشاء مستخدم جديد
    user = User(
        username=username,
        email='testuser@example.com',
        is_admin=False,
        organization=org
    )
    user.set_password(password)
    user.save()
    print(f'تم إنشاء المستخدم بنجاح: {user.username}')

print(f'\nبيانات تسجيل الدخول:')
print(f'اسم المستخدم: {username}')
print(f'كلمة المرور: {password}')
