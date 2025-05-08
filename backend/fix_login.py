from django.db import connection
from django.utils.text import slugify

# إنشاء مؤسسة افتراضية إذا لم تكن موجودة
def create_default_organization():
    cursor = connection.cursor()
    
    # التحقق من وجود مؤسسة افتراضية
    cursor.execute("SELECT id FROM organizations_organization WHERE name='مؤسسة افتراضية' LIMIT 1")
    org = cursor.fetchone()
    
    if not org:
        # إنشاء مؤسسة افتراضية
        slug = slugify('مؤسسة افتراضية')
        cursor.execute(
            "INSERT INTO organizations_organization (name, slug, created_at) VALUES (%s, %s, datetime('now'))",
            ['مؤسسة افتراضية', slug]
        )
        cursor.execute("SELECT last_insert_rowid()")
        org_id = cursor.fetchone()[0]
        print(f"تم إنشاء مؤسسة افتراضية بمعرف: {org_id}")
        return org_id
    else:
        print(f"المؤسسة الافتراضية موجودة بالفعل بمعرف: {org[0]}")
        return org[0]

# تحديث المستخدمين الذين ليس لديهم مؤسسة
def update_users_without_organization(org_id):
    cursor = connection.cursor()
    
    # الحصول على عدد المستخدمين الذين ليس لديهم مؤسسة
    cursor.execute("SELECT COUNT(*) FROM users_user WHERE organization_id IS NULL")
    count = cursor.fetchone()[0]
    print(f"عدد المستخدمين بدون مؤسسة: {count}")
    
    if count > 0:
        # تعيين المؤسسة الافتراضية لجميع المستخدمين الذين ليس لديهم مؤسسة
        cursor.execute("UPDATE users_user SET organization_id = %s WHERE organization_id IS NULL", [org_id])
        print(f"تم تحديث {count} مستخدم بالمؤسسة الافتراضية")

# إنشاء مستخدم إداري جديد
def create_admin_user(org_id):
    cursor = connection.cursor()
    
    # التحقق من وجود مستخدم admin
    cursor.execute("SELECT id FROM users_user WHERE username='admin' LIMIT 1")
    admin = cursor.fetchone()
    
    if not admin:
        # إنشاء مستخدم admin جديد
        from django.contrib.auth.hashers import make_password
        password_hash = make_password('Admin123456')
        
        cursor.execute("""
            INSERT INTO users_user (
                password, last_login, is_superuser, username, first_name, 
                last_name, email, is_staff, is_active, date_joined, is_admin, organization_id
            ) VALUES (
                %s, NULL, 1, 'admin', '', '', 'admin@example.com', 1, 1, datetime('now'), 1, %s
            )
        """, [password_hash, org_id])
        
        cursor.execute("SELECT last_insert_rowid()")
        admin_id = cursor.fetchone()[0]
        print(f"تم إنشاء مستخدم admin جديد بمعرف: {admin_id}")
        
        # إضافة المستخدم إلى جميع مجموعات الصلاحيات
        cursor.execute("SELECT id FROM auth_group")
        groups = cursor.fetchall()
        for group in groups:
            cursor.execute(
                "INSERT INTO users_user_groups (user_id, group_id) VALUES (%s, %s)",
                [admin_id, group[0]]
            )
        
        return admin_id
    else:
        # تحديث المستخدم الموجود للتأكد من أن لديه مؤسسة
        cursor.execute("UPDATE users_user SET organization_id = %s WHERE username='admin'", [org_id])
        print(f"تم تحديث المستخدم admin الموجود بمعرف: {admin[0]}")
        return admin[0]

# تنفيذ الإصلاحات
if __name__ == "__main__":
    org_id = create_default_organization()
    update_users_without_organization(org_id)
    create_admin_user(org_id)
    print("تم إصلاح مشكلة تسجيل الدخول بنجاح!")
    print("يمكنك الآن تسجيل الدخول باستخدام:")
    print("اسم المستخدم: admin")
    print("كلمة المرور: Admin123456")
