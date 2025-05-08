"""
ملف وسيط لمعالجة الأخطاء في تطبيق المشاريع
"""
import json
import traceback
from django.http import JsonResponse
from django.conf import settings

class ProjectErrorMiddleware:
    """
    وسيط لمعالجة الأخطاء في تطبيق المشاريع
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # معالجة الطلب
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            # تسجيل الخطأ
            print(f"ERROR: حدث خطأ أثناء معالجة الطلب: {str(e)}")
            print(traceback.format_exc())
            
            # إرجاع استجابة خطأ
            return JsonResponse({
                'error': 'حدث خطأ أثناء معالجة الطلب',
                'details': str(e)
            }, status=500)
