from django.core.management.base import BaseCommand
from organizations.models import Organization
from users.models import User
from django.db import transaction


class Command(BaseCommand):
    help = 'إعداد البيانات الأولية للنظام (المؤسسات والمستخدمين الأساسيين)'

    def handle(self, *args, **kwargs):
        self.stdout.write('بدء إعداد البيانات الأولية...')
        
        with transaction.atomic():
            # إنشاء المؤسسة الرئيسية إذا لم تكن موجودة
            main_org, created = Organization.objects.get_or_create(
                name="المؤسسة الرئيسية",
                defaults={
                    'slug': 'main-organization'
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'تم إنشاء المؤسسة الرئيسية: {main_org.name}'))
            else:
                self.stdout.write(f'المؤسسة الرئيسية موجودة بالفعل: {main_org.name}')
            
            # إنشاء المؤسسة الافتراضية إذا لم تكن موجودة
            default_org = Organization.get_or_create_default()
            self.stdout.write(self.style.SUCCESS(f'تم التأكد من وجود المؤسسة الافتراضية: {default_org.name}'))
            
            # إنشاء مستخدم مشرف النظام إذا لم يكن موجوداً
            admin_username = 'admin'
            if not User.objects.filter(username=admin_username).exists():
                admin_user = User.objects.create_superuser(
                    username=admin_username,
                    email='admin@example.com',
                    password='admin123',  # يجب تغيير كلمة المرور في بيئة الإنتاج
                    organization=main_org,
                    is_system_owner=True,
                    is_admin=True
                )
                self.stdout.write(self.style.SUCCESS(f'تم إنشاء مستخدم مشرف النظام: {admin_user.username}'))
            else:
                self.stdout.write(f'مستخدم مشرف النظام موجود بالفعل: {admin_username}')
            
            # التأكد من أن جميع المستخدمين لديهم مؤسسة
            users_without_org = User.objects.filter(organization__isnull=True)
            if users_without_org.exists():
                count = users_without_org.count()
                users_without_org.update(organization=default_org)
                self.stdout.write(self.style.SUCCESS(f'تم تعيين المؤسسة الافتراضية لـ {count} مستخدم'))
        
        self.stdout.write(self.style.SUCCESS('تم إعداد البيانات الأولية بنجاح!'))
