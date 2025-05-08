import os
import django

# إعداد بيئة Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from django.utils.text import slugify
from organizations.models import Organization
from users.models import User

def main():
    print("بدء إصلاح المستخدم الإداري...")
    
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
    
    # تحديث المستخدم الإداري
    try:
        admin_user = User.objects.get(username='admin')
        admin_user.organization = org
        admin_user.is_admin = True
        admin_user.save()
        print(f"تم تحديث المستخدم الإداري: {admin_user.username}")
        print(f"المؤسسة: {admin_user.organization.name}")
        print(f"هل هو مشرف؟ {admin_user.is_admin}")
    except User.DoesNotExist:
        print("المستخدم الإداري غير موجود!")
    except Exception as e:
        print(f"خطأ في تحديث المستخدم الإداري: {str(e)}")
    
    print("تم الانتهاء بنجاح!")

if __name__ == "__main__":
    main()
