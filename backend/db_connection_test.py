"""
سكريبت للتحقق من الاتصال بقاعدة بيانات PostgreSQL
"""
import os
import sys
import django
from django.db import connections
from django.db.utils import OperationalError
import psycopg2
from decouple import config

# إضافة المسار إلى إعدادات Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trello_backend.settings')
django.setup()

def test_django_connection():
    """اختبار الاتصال باستخدام Django"""
    print("=== اختبار الاتصال باستخدام Django ===")
    try:
        # محاولة الاتصال بقاعدة البيانات
        db_conn = connections['default']
        db_conn.cursor()
        print("✅ تم الاتصال بنجاح بقاعدة البيانات باستخدام Django!")
        
        # عرض معلومات الاتصال
        db_settings = connections.databases['default']
        print(f"🔹 اسم قاعدة البيانات: {db_settings['NAME']}")
        print(f"🔹 المستخدم: {db_settings['USER']}")
        print(f"🔹 المضيف: {db_settings['HOST']}")
        print(f"🔹 المنفذ: {db_settings['PORT']}")
        
        # عرض إحصائيات قاعدة البيانات
        with db_conn.cursor() as cursor:
            # عدد الجداول
            cursor.execute("""
                SELECT count(*) FROM information_schema.tables 
                WHERE table_schema = 'public';
            """)
            table_count = cursor.fetchone()[0]
            print(f"📊 عدد الجداول في قاعدة البيانات: {table_count}")
            
            # قائمة الجداول
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            print("📋 قائمة الجداول:")
            for table in tables:
                print(f"  - {table[0]}")
                
    except OperationalError as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
    except Exception as e:
        print(f"❌ حدث خطأ غير متوقع: {e}")

def test_direct_connection():
    """اختبار الاتصال المباشر باستخدام psycopg2"""
    print("\n=== اختبار الاتصال المباشر باستخدام psycopg2 ===")
    try:
        # الحصول على بيانات الاتصال من ملف الإعدادات
        db_name = config('DB_NAME', default='Trello_Project')
        db_user = config('DB_USER', default='postgres')
        db_password = config('DB_PASSWORD', default='postgres')
        db_host = config('DB_HOST', default='localhost')
        db_port = config('DB_PORT', default='5432')
        
        # محاولة الاتصال المباشر
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        print("✅ تم الاتصال المباشر بنجاح بقاعدة البيانات!")
        
        # عرض معلومات إضافية عن الخادم
        with conn.cursor() as cursor:
            # إصدار PostgreSQL
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"🔹 إصدار PostgreSQL: {version}")
            
            # حجم قاعدة البيانات
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database()));
            """)
            db_size = cursor.fetchone()[0]
            print(f"🔹 حجم قاعدة البيانات: {db_size}")
            
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ خطأ في الاتصال المباشر بقاعدة البيانات: {e}")
    except Exception as e:
        print(f"❌ حدث خطأ غير متوقع: {e}")

if __name__ == "__main__":
    print("🔍 جاري التحقق من الاتصال بقاعدة بيانات PostgreSQL...\n")
    test_django_connection()
    test_direct_connection()
    print("\n✨ اكتمل التحقق من الاتصال ✨")
