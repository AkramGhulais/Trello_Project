from rest_framework import permissions
from .models import TaskComment


class IsCommentAuthor(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو مؤلف التعليق
    يسمح فقط لمؤلف التعليق بتعديله
    لا يمكن لأي شخص آخر تعديل التعليق، حتى لو كان مشرف مؤسسة أو مالك النظام
    """
    
    def has_object_permission(self, request, view, obj):
        # التحقق من أن المستخدم هو مؤلف التعليق
        if isinstance(obj, TaskComment):
            is_author = obj.author == request.user
            print(f"DEBUG: التحقق من صلاحية تعديل التعليق - المستخدم: {request.user.username}, مؤلف التعليق: {obj.author.username}, النتيجة: {is_author}")
            return is_author
        return False


class CanDeleteComment(permissions.BasePermission):
    """
    التحقق من أن المستخدم لديه صلاحية حذف التعليق
    يسمح للأشخاص التاليين بحذف التعليق:
    1. مؤلف التعليق (الشخص الذي كتبه)
    2. مشرف المؤسسة (يمكنه حذف أي تعليق في مؤسسته)
    3. مالك النظام (يمكنه حذف أي تعليق في النظام)
    """
    
    def has_object_permission(self, request, view, obj):
        result = False
        reason = ""
        
        # مالك النظام لديه صلاحية حذف أي تعليق
        if request.user.is_system_owner:
            result = True
            reason = "مالك النظام"
            
        # التحقق من أن المستخدم هو مؤلف التعليق
        elif isinstance(obj, TaskComment):
            # مؤلف التعليق يمكنه حذفه
            if obj.author == request.user:
                result = True
                reason = "مؤلف التعليق"
                
            # مشرف المؤسسة يمكنه حذف أي تعليق في مؤسسته
            elif request.user.is_admin and obj.task.organization == request.user.organization:
                result = True
                reason = "مشرف المؤسسة"
        
        print(f"DEBUG: التحقق من صلاحية حذف التعليق - المستخدم: {request.user.username}, النتيجة: {result}, السبب: {reason}")
        return result
