"""
سكريبت لإصلاح المؤسسات الافتراضية في قاعدة البيانات
يقوم بتوحيد جميع المؤسسات الافتراضية في مؤسسة واحدة
"""
import os
import sys
import django

# إضافة المسار إلى إعدادات Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from django.db import transaction
from organizations.models import Organization
from users.models import User

def fix_default_organizations():
    """توحيد المؤسسات الافتراضية وتحديث المستخدمين"""
    print("🔍 بدء إصلاح المؤسسات الافتراضية...")
    
    with transaction.atomic():
        # عرض جميع المؤسسات الموجودة في النظام
        all_orgs = Organization.objects.all().select_for_update()
        print(f"📊 إجمالي عدد المؤسسات في النظام: {all_orgs.count()}")
        
        for org in all_orgs:
            users_count = User.objects.filter(organization=org).count()
            print(f"  - {org.name} (id: {org.id}, slug: {org.slug}) - عدد المستخدمين: {users_count}")
        
        # البحث عن المؤسسات الافتراضية
        default_orgs = Organization.objects.filter(name="مؤسسة افتراضية").select_for_update()
        count = default_orgs.count()
        
        if count == 0:
            print("❌ لم يتم العثور على أي مؤسسة افتراضية!")
            # إنشاء مؤسسة افتراضية جديدة
            default_org = Organization.get_or_create_default()
            print(f"✅ تم إنشاء مؤسسة افتراضية جديدة: {default_org.name} (id: {default_org.id}, slug: {default_org.slug})")
            
            # تحديث المستخدمين الذين ليس لديهم مؤسسة
            users_without_org = User.objects.filter(organization__isnull=True)
            if users_without_org.exists():
                count = users_without_org.count()
                users_without_org.update(organization=default_org)
                print(f"✅ تم تحديث {count} مستخدم ليس لديهم مؤسسة إلى المؤسسة الافتراضية الجديدة")
            return
        
        print(f"🔍 تم العثور على {count} مؤسسة افتراضية:")
        for org in default_orgs:
            # عرض معلومات كل مؤسسة افتراضية
            users_count = User.objects.filter(organization=org).count()
            print(f"  - {org.name} (id: {org.id}, slug: {org.slug}) - عدد المستخدمين: {users_count}")
        
        # التحقق من المؤسسة المسماة "المؤسسة الافتراضية" (بدون مسافة في البداية)
        other_default_orgs = Organization.objects.filter(name="المؤسسة الافتراضية").select_for_update()
        if other_default_orgs.exists():
            print(f"🔍 تم العثور على {other_default_orgs.count()} مؤسسة بإسم 'المؤسسة الافتراضية':")
            for org in other_default_orgs:
                users_count = User.objects.filter(organization=org).count()
                print(f"  - {org.name} (id: {org.id}, slug: {org.slug}) - عدد المستخدمين: {users_count}")
            
            # إضافة هذه المؤسسات إلى قائمة المؤسسات الافتراضية
            default_orgs = list(default_orgs) + list(other_default_orgs)
        
        # اختيار المؤسسة التي لديها أكبر عدد من المستخدمين كمؤسسة رئيسية
        main_org = None
        max_users = -1
        
        for org in default_orgs:
            users_count = User.objects.filter(organization=org).count()
            if users_count > max_users:
                max_users = users_count
                main_org = org
        
        if not main_org:
            # إذا لم يتم العثور على مؤسسة رئيسية، استخدم الأولى
            main_org = default_orgs[0]
        
        print(f"✅ تم اختيار المؤسسة الافتراضية الرئيسية: {main_org.name} (id: {main_org.id}, slug: {main_org.slug}) - عدد المستخدمين: {max_users}")
        
        # تحديث جميع المستخدمين لاستخدام المؤسسة الافتراضية الرئيسية
        updated_users = 0
        for org in all_orgs:
            if org.id != main_org.id and (org.name == "مؤسسة افتراضية" or org.name == "المؤسسة الافتراضية"):
                # تحديث المستخدمين المرتبطين بهذه المؤسسة
                users = User.objects.filter(organization=org)
                user_count = users.count()
                if user_count > 0:
                    users.update(organization=main_org)
                    updated_users += user_count
                    print(f"✅ تم تحديث {user_count} مستخدم من المؤسسة {org.id} إلى المؤسسة الرئيسية {main_org.id}")
                
                # حذف المؤسسة الزائدة
                org_id = org.id
                org.delete()
                print(f"🗑️ تم حذف المؤسسة الافتراضية الزائدة: {org_id}")
        
        # تحديث المستخدمين الذين ليس لديهم مؤسسة
        users_without_org = User.objects.filter(organization__isnull=True)
        if users_without_org.exists():
            count = users_without_org.count()
            users_without_org.update(organization=main_org)
            updated_users += count
            print(f"✅ تم تحديث {count} مستخدم ليس لديهم مؤسسة إلى المؤسسة الافتراضية الرئيسية")
        
        print(f"✅ تم تحديث إجمالي {updated_users} مستخدم إلى المؤسسة الافتراضية الرئيسية")
        print(f"✅ الآن يوجد مؤسسة افتراضية واحدة فقط: {main_org.name} (id: {main_org.id}, slug: {main_org.slug})")

if __name__ == "__main__":
    fix_default_organizations()
    print("\n✨ اكتمل إصلاح المؤسسات الافتراضية ✨")
