from django.db import models
from django.db.utils import IntegrityError
import uuid


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    @staticmethod
    def get_or_create_default():
        """
        الحصول على المؤسسة الافتراضية أو إنشائها إذا لم تكن موجودة
        مع التعامل مع حالات التزامن والأخطاء المحتملة
        """
        from django.db import transaction
        
        # استخدام المعاملة لضمان التزامن
        with transaction.atomic():
            try:
                # محاولة الحصول على المؤسسة الافتراضية إذا كانت موجودة
                # استخدام select_for_update لمنع التعديل المتزامن
                default_orgs = Organization.objects.filter(name="مؤسسة افتراضية").select_for_update()
                
                # إذا وجدت مؤسسة افتراضية واحدة على الأقل
                if default_orgs.exists():
                    # إذا وجدت أكثر من مؤسسة افتراضية، استخدم الأولى واحذف الباقي
                    if default_orgs.count() > 1:
                        # الاحتفاظ بالمؤسسة الأولى
                        default_org = default_orgs.first()
                        # حذف المؤسسات الأخرى
                        default_orgs.exclude(id=default_org.id).delete()
                        print(f"INFO: تم حذف المؤسسات الافتراضية المتكررة والاحتفاظ بالمؤسسة: {default_org.id}")
                    else:
                        default_org = default_orgs.first()
                    
                    return default_org
                
                # إذا لم توجد مؤسسة افتراضية، قم بإنشائها
                # إنشاء المؤسسة الافتراضية مع slug فريد
                unique_slug = f"default-org-{uuid.uuid4().hex[:8]}"
                default_org = Organization.objects.create(
                    name="مؤسسة افتراضية",
                    slug=unique_slug
                )
                print(f"INFO: تم إنشاء مؤسسة افتراضية جديدة: {default_org.id} (slug: {default_org.slug})")
                return default_org
                
            except IntegrityError as e:
                # في حالة حدوث خطأ تكامل (مثل تكرار slug)
                print(f"WARNING: حدث خطأ تكامل عند إنشاء المؤسسة الافتراضية: {str(e)}")
                # محاولة الحصول على المؤسسة الافتراضية الموجودة
                default_org = Organization.objects.filter(name="مؤسسة افتراضية").first()
                if default_org:
                    return default_org
                # إذا لم يتم العثور على مؤسسة افتراضية، نحاول مرة أخرى مع slug مختلف
                unique_slug = f"default-org-{uuid.uuid4().hex}"
                default_org = Organization.objects.create(
                    name="مؤسسة افتراضية",
                    slug=unique_slug
                )
                print(f"INFO: تم إنشاء مؤسسة افتراضية جديدة بعد معالجة الخطأ: {default_org.id} (slug: {default_org.slug})")
                return default_org
            except Exception as e:
                # تسجيل الخطأ وإعادة إثارته للتعامل معه في المستوى الأعلى
                print(f"ERROR: خطأ في إنشاء المؤسسة الافتراضية: {str(e)}")
                raise
