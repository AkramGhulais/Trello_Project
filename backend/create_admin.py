import os
import django

# إعداد بيئة Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from django.utils.text import slugify
from organizations.models import Organization
from users.models import User

def main():
    print("بدء إنشاء مستخدم إداري...")
    
    # إنشاء مؤسسة افتراضية
    try:
        org, created = Organization.objects.get_or_create(
            name='مؤسسة افتراضية',
            defaults={'slug': slugify('مؤسسة افتراضية')}
        )
        if created:
            print(f"تم إنشاء مؤسسة جديدة: {org.name}")
        else:
            print(f"المؤسسة موجودة بالفعل: {org.name}")
    except Exception as e:
        print(f"خطأ في إنشاء المؤسسة: {str(e)}")
        return
    
    # إنشاء مستخدم إداري
    try:
        username = 'admin'
        password = 'Admin123456'
        
        try:
            user = User.objects.get(username=username)
            user.organization = org
            user.set_password(password)
            user.is_admin = True
            user.is_staff = True
            user.is_superuser = True
            user.save()
            print(f"تم تحديث المستخدم الموجود: {user.username}")
        except User.DoesNotExist:
            user = User.objects.create_superuser(
                username=username,
                email='admin@example.com',
                password=password,
                organization=org,
                is_admin=True
            )
            print(f"تم إنشاء مستخدم جديد: {user.username}")
        
        print("\nيمكنك الآن تسجيل الدخول باستخدام:")
        print(f"اسم المستخدم: {username}")
        print(f"كلمة المرور: {password}")
        
    except Exception as e:
        print(f"خطأ في إنشاء المستخدم: {str(e)}")
        return
    
    # تحديث المستخدمين الذين ليس لديهم مؤسسة
    try:
        users_without_org = User.objects.filter(organization__isnull=True)
        count = users_without_org.count()
        if count > 0:
            users_without_org.update(organization=org)
            print(f"تم تحديث {count} مستخدم بدون مؤسسة")
    except Exception as e:
        print(f"خطأ في تحديث المستخدمين: {str(e)}")
    
    print("تم الانتهاء بنجاح!")

if __name__ == "__main__":
    main()
