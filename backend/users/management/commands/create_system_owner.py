from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
from organizations.models import Organization


class Command(BaseCommand):
    help = 'إنشاء مالك للنظام مع صلاحيات كاملة'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='اسم المستخدم')
        parser.add_argument('--email', type=str, required=True, help='البريد الإلكتروني')
        parser.add_argument('--password', type=str, required=True, help='كلمة المرور')
        parser.add_argument('--org_name', type=str, default='المؤسسة الرئيسية', help='اسم المؤسسة')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        org_name = options['org_name']

        try:
            with transaction.atomic():
                # التحقق من وجود المستخدم
                if User.objects.filter(username=username).exists():
                    self.stdout.write(self.style.WARNING(f'المستخدم {username} موجود بالفعل'))
                    user = User.objects.get(username=username)
                    # تحديث المستخدم ليكون مالك للنظام
                    user.is_system_owner = True
                    user.is_admin = True
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'تم تحديث المستخدم {username} ليكون مالك للنظام'))
                    return
                
                # إنشاء أو الحصول على المؤسسة
                organization, created = Organization.objects.get_or_create(
                    name=org_name,
                    defaults={'slug': org_name.lower().replace(' ', '-')}
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'تم إنشاء المؤسسة {org_name}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'تم استخدام المؤسسة الموجودة {org_name}'))
                
                # إنشاء المستخدم مالك النظام
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    organization=organization,
                    is_system_owner=True,
                    is_admin=True,
                    is_staff=True,
                    is_superuser=True
                )
                
                self.stdout.write(self.style.SUCCESS(f'تم إنشاء مالك النظام {username} بنجاح'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'حدث خطأ أثناء إنشاء مالك النظام: {str(e)}'))
