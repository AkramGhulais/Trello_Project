from django.core.management.base import BaseCommand
from organizations.models import Organization


class Command(BaseCommand):
    help = 'إنشاء المؤسسة الافتراضية إذا لم تكن موجودة'

    def handle(self, *args, **options):
        # التحقق من وجود المؤسسة الافتراضية
        default_org, created = Organization.objects.get_or_create(
            name="المؤسسة الافتراضية",
            defaults={'slug': 'default-organization'}
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('تم إنشاء المؤسسة الافتراضية بنجاح'))
        else:
            self.stdout.write(self.style.SUCCESS('المؤسسة الافتراضية موجودة بالفعل'))
