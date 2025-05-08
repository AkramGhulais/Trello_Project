"""
سكريبت لاختبار إنشاء المؤسسة الافتراضية وتعيينها للمستخدمين
"""
import os
import sys
import django
import time
import threading

# إضافة المسار إلى إعدادات Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

from organizations.models import Organization
from users.models import User
from django.db import transaction

def test_default_organization():
    """اختبار الحصول على المؤسسة الافتراضية"""
    print("\n=== اختبار الحصول على المؤسسة الافتراضية ===")
    
    # حذف أي مؤسسات افتراضية موجودة سابقاً للاختبار
    try:
        default_orgs = Organization.objects.filter(name="مؤسسة افتراضية")
        count = default_orgs.count()
        if count > 0:
            print(f"🔍 تم العثور على {count} مؤسسة افتراضية موجودة مسبقاً")
            for org in default_orgs:
                print(f"  - {org.name} (slug: {org.slug}, id: {org.id})")
            
            # حذف المؤسسات الافتراضية (فقط للاختبار)
            default_orgs.delete()
            print("🗑️ تم حذف المؤسسات الافتراضية السابقة للاختبار")
    except Exception as e:
        print(f"❌ خطأ في حذف المؤسسات الافتراضية: {e}")
    
    # اختبار إنشاء المؤسسة الافتراضية
    try:
        default_org = Organization.get_or_create_default()
        print(f"✅ تم إنشاء المؤسسة الافتراضية بنجاح: {default_org.name} (slug: {default_org.slug}, id: {default_org.id})")
        
        # اختبار الحصول على نفس المؤسسة مرة أخرى
        default_org2 = Organization.get_or_create_default()
        print(f"✅ تم الحصول على المؤسسة الافتراضية مرة أخرى: {default_org2.name} (slug: {default_org2.slug}, id: {default_org2.id})")
        
        # التحقق من أنها نفس المؤسسة
        if default_org.id == default_org2.id:
            print("✅ تم التحقق: المؤسستان متطابقتان")
        else:
            print("❌ خطأ: تم إنشاء مؤسسة جديدة بدلاً من استخدام الموجودة")
    except Exception as e:
        print(f"❌ خطأ في إنشاء المؤسسة الافتراضية: {e}")

def test_concurrent_access():
    """اختبار الوصول المتزامن للمؤسسة الافتراضية"""
    print("\n=== اختبار الوصول المتزامن للمؤسسة الافتراضية ===")
    
    # حذف أي مؤسسات افتراضية موجودة سابقاً للاختبار
    try:
        Organization.objects.filter(name="مؤسسة افتراضية").delete()
        print("🗑️ تم حذف المؤسسات الافتراضية السابقة للاختبار")
    except Exception as e:
        print(f"❌ خطأ في حذف المؤسسات الافتراضية: {e}")
    
    # إنشاء دالة للحصول على المؤسسة الافتراضية في خيط منفصل
    def get_default_org(thread_id):
        try:
            # إضافة تأخير عشوائي لمحاكاة التزامن
            time.sleep(0.1)
            with transaction.atomic():
                default_org = Organization.get_or_create_default()
                print(f"✅ الخيط {thread_id}: تم الحصول على المؤسسة الافتراضية: {default_org.name} (slug: {default_org.slug}, id: {default_org.id})")
                return default_org
        except Exception as e:
            print(f"❌ الخيط {thread_id}: خطأ في الحصول على المؤسسة الافتراضية: {e}")
            return None
    
    # إنشاء عدة خيوط للوصول إلى المؤسسة الافتراضية في نفس الوقت
    threads = []
    results = [None] * 5
    
    for i in range(5):
        thread = threading.Thread(target=lambda idx=i: results.__setitem__(idx, get_default_org(idx)))
        threads.append(thread)
    
    # تشغيل الخيوط
    for thread in threads:
        thread.start()
    
    # انتظار انتهاء جميع الخيوط
    for thread in threads:
        thread.join()
    
    # التحقق من النتائج
    org_ids = set()
    for i, org in enumerate(results):
        if org:
            org_ids.add(org.id)
    
    if len(org_ids) == 1:
        print(f"✅ تم التحقق: جميع الخيوط حصلت على نفس المؤسسة الافتراضية (id: {list(org_ids)[0]})")
    else:
        print(f"❌ خطأ: تم إنشاء مؤسسات مختلفة ({len(org_ids)} مؤسسة)")
        
    # عرض جميع المؤسسات الافتراضية في قاعدة البيانات
    default_orgs = Organization.objects.filter(name="مؤسسة افتراضية")
    print(f"📊 عدد المؤسسات الافتراضية في قاعدة البيانات: {default_orgs.count()}")
    for org in default_orgs:
        print(f"  - {org.name} (slug: {org.slug}, id: {org.id})")

def test_user_with_default_org():
    """اختبار تعيين المؤسسة الافتراضية للمستخدم"""
    print("\n=== اختبار تعيين المؤسسة الافتراضية للمستخدم ===")
    
    # التأكد من وجود مؤسسة افتراضية
    default_org = Organization.get_or_create_default()
    print(f"✅ المؤسسة الافتراضية: {default_org.name} (slug: {default_org.slug}, id: {default_org.id})")
    
    # إنشاء مستخدم اختبار بدون مؤسسة
    username = f"testuser_{int(time.time())}"
    try:
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="password123",
            organization=None  # بدون مؤسسة
        )
        print(f"✅ تم إنشاء مستخدم اختبار: {user.username} (id: {user.id})")
        
        # التحقق من أن المستخدم ليس لديه مؤسسة
        if user.organization is None:
            print("✅ المستخدم ليس لديه مؤسسة كما هو متوقع")
        else:
            print(f"❓ المستخدم لديه مؤسسة بالفعل: {user.organization.name}")
        
        # محاكاة الكود في UserViewSet.get_queryset
        if not user.organization:
            user.organization = Organization.get_or_create_default()
            user.save()
            print(f"✅ تم تعيين المؤسسة الافتراضية للمستخدم: {user.organization.name} (slug: {user.organization.slug})")
        
        # التحقق من أن المستخدم الآن لديه المؤسسة الافتراضية
        user.refresh_from_db()
        if user.organization:
            print(f"✅ المستخدم الآن لديه مؤسسة: {user.organization.name} (id: {user.organization.id})")
            if user.organization.id == default_org.id:
                print("✅ تم التحقق: المؤسسة المعينة هي المؤسسة الافتراضية المتوقعة")
            else:
                print("❌ خطأ: المؤسسة المعينة ليست المؤسسة الافتراضية المتوقعة")
        else:
            print("❌ خطأ: المستخدم ما زال بدون مؤسسة")
        
        # تنظيف - حذف مستخدم الاختبار
        user.delete()
        print(f"🗑️ تم حذف مستخدم الاختبار: {username}")
    except Exception as e:
        print(f"❌ خطأ في اختبار المستخدم: {e}")

if __name__ == "__main__":
    print("🔍 بدء اختبار المؤسسة الافتراضية...\n")
    
    test_default_organization()
    test_concurrent_access()
    test_user_with_default_org()
    
    print("\n✨ اكتمل اختبار المؤسسة الافتراضية ✨")
