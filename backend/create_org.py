import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from organizations.models import Organization
from users.models import User
from django.contrib.auth.hashers import make_password

# التحقق من وجود المنظمة أو إنشاء واحدة جديدة
try:
    org = Organization.objects.get(slug='sofaa')
    print(f'تم العثور على المنظمة: {org.id}')
except Organization.DoesNotExist:
    org = Organization(name='شركة سوفا', slug='sofaa')
    org.save()
    print(f'تم إنشاء المنظمة بنجاح: {org.id}')

# إنشاء مستخدم عادي جديد
username = 'user1'
try:
    user = User.objects.get(username=username)
    print(f'المستخدم موجود بالفعل: {user.username}')
except User.DoesNotExist:
    user = User(
        username=username,
        email='user1@example.com',
        password=make_password('User1234!'),
        is_admin=False,
        organization=org
    )
    user.save()
    print(f'تم إنشاء المستخدم بنجاح: {user.username}')
