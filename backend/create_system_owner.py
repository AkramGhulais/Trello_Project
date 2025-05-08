import os
import django
import sys

# إعداد بيئة Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from users.models import User
from organizations.models import Organization

def create_system_owner():
    """
    هذا السكريبت يقوم بتعيين أول مستخدم في النظام كمالك للنظام (System Owner)
    إذا لم يكن هناك مالك للنظام بالفعل
    
    المالك العام لا ينتمي لأي مؤسسة، بل يشرف على كل المؤسسات بشكل محايد.
    """
    # التحقق من وجود مستخدمين
    if User.objects.count() == 0:
        print("لا يوجد مستخدمين في النظام. يرجى إنشاء مستخدم أولاً.")
        return
    
    # التحقق من وجود مالك للنظام
    if User.objects.filter(is_system_owner=True).exists():
        system_owner = User.objects.filter(is_system_owner=True).first()
        
        # التأكد من أن المالك ليس جزءاً من أي مؤسسة
        if system_owner.organization is not None:
            system_owner.organization = None
            system_owner.save()
            print(f"تم إزالة المالك {system_owner.username} من المؤسسة وجعله محايداً.")
        
        print(f"يوجد بالفعل مالك للنظام: {system_owner.username}")
        return
    
    # تعيين أول مستخدم كمالك للنظام
    first_user = User.objects.order_by('date_joined').first()
    first_user.is_system_owner = True
    first_user.is_admin = True  # جعل المالك مشرف أيضاً
    first_user.organization = None  # إزالة المالك من أي مؤسسة
    first_user.save()
    
    print(f"تم تعيين المستخدم {first_user.username} كمالك للنظام بنجاح وإزالته من أي مؤسسة.")

if __name__ == '__main__':
    try:
        create_system_owner()
    except Exception as e:
        print(f"حدث خطأ: {str(e)}")
