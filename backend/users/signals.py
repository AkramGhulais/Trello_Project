from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import User
from organizations.models import Organization


@receiver(pre_save, sender=User)
def assign_default_organization(sender, instance, **kwargs):
    """
    إشارة لتعيين المؤسسة الافتراضية للمستخدم إذا لم يتم تعيين مؤسسة له
    """
    if not instance.organization:
        # الحصول على المؤسسة الافتراضية أو إنشاؤها إذا لم تكن موجودة
        default_org, created = Organization.objects.get_or_create(
            name="المؤسسة الافتراضية",
            defaults={'slug': 'default-organization'}
        )
        
        # تعيين المؤسسة الافتراضية للمستخدم
        instance.organization = default_org
