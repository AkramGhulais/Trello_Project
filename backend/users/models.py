from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from organizations.models import Organization


class CustomUserManager(UserManager):
    """
    مدير مخصص للمستخدمين يضمن تعيين المؤسسة الافتراضية للمستخدمين الجدد
    """
    def create_user(self, username, email=None, password=None, **extra_fields):
        # إنشاء المستخدم باستخدام الطريقة الأصلية
        user = super().create_user(username, email, password, **extra_fields)
        
        # إذا لم يتم تحديد مؤسسة، استخدم المؤسسة الافتراضية
        if 'organization' not in extra_fields or not user.organization:
            # استيراد هنا لتجنب الاستيراد الدائري
            from organizations.models import Organization
            user.organization = Organization.get_or_create_default()
            user.save(update_fields=['organization'])
            print(f"INFO: تم تعيين المؤسسة الافتراضية للمستخدم الجديد: {username} - {user.organization.name} (id: {user.organization.id})")
        
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        # إنشاء المستخدم الخارق باستخدام الطريقة الأصلية
        user = super().create_superuser(username, email, password, **extra_fields)
        
        # إذا لم يتم تحديد مؤسسة، استخدم المؤسسة الافتراضية
        if 'organization' not in extra_fields or not user.organization:
            # استيراد هنا لتجنب الاستيراد الدائري
            from organizations.models import Organization
            user.organization = Organization.get_or_create_default()
            user.save(update_fields=['organization'])
            print(f"INFO: تم تعيين المؤسسة الافتراضية للمستخدم الخارق الجديد: {username} - {user.organization.name} (id: {user.organization.id})")
        
        # تعيين المستخدم الخارق كمالك للنظام
        user.is_system_owner = True
        user.save(update_fields=['is_system_owner'])
        
        return user


class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_system_owner = models.BooleanField(default=False)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='users',
        null=True,
        blank=True
    )
    
    # استخدام مدير المستخدمين المخصص
    objects = CustomUserManager()
    
    def save(self, *args, **kwargs):
        # إذا كان المستخدم جديداً أو تم تحديثه وليس لديه مؤسسة، استخدم المؤسسة الافتراضية
        if not self.organization and not self._state.adding:
            # استيراد هنا لتجنب الاستيراد الدائري
            from organizations.models import Organization
            self.organization = Organization.get_or_create_default()
            print(f"INFO: تم تعيين المؤسسة الافتراضية للمستخدم عند الحفظ: {self.username} - {self.organization.name} (id: {self.organization.id})")
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
