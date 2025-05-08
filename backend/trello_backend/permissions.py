from rest_framework import permissions
from users.models import User


class IsSameOrganization(permissions.BasePermission):
    """
    التحقق من أن المستخدم ينتمي إلى نفس المؤسسة التي ينتمي إليها الكائن
    قاعدة العزل الأساسية: لا يمكن للمستخدم الوصول إلى أي كيان خارج مؤسسته
    استثناء: مالك النظام يمكنه الوصول إلى كل شيء
    """
    
    def has_permission(self, request, view):
        # التحقق من أن المستخدم مسجل الدخول
        if not request.user.is_authenticated:
            return False
        
        # مالك النظام لديه وصول كامل لكل شيء
        if request.user.is_system_owner:
            return True
            
        # التحقق من أن المستخدم لديه مؤسسة
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
            
        return True
    
    def has_object_permission(self, request, view, obj):
        # مالك النظام لديه وصول كامل لكل شيء
        if request.user.is_system_owner:
            return True
            
        # التحقق من أن المستخدم ينتمي إلى نفس المؤسسة
        if hasattr(obj, 'organization'):
            return obj.organization == request.user.organization
        # إذا كان الكائن هو المستخدم نفسه
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        return False


class IsOrganizationAdmin(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو أدمن في المؤسسة
    الأدمن يتحكم بجميع مشاريع ومهام ومستخدمي مؤسسته فقط
    """
    
    def has_permission(self, request, view):
        # التحقق من أن المستخدم مسجل الدخول وله مؤسسة
        if not request.user.is_authenticated:
            return False
            
        # التحقق من أن المستخدم لديه مؤسسة
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
            
        # للعمليات التي تتطلب صلاحيات الأدمن، يجب أن يكون المستخدم أدمن
        return request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        # التحقق من أن المستخدم أدمن ومن نفس المؤسسة
        if not request.user.is_admin:
            return False
            
        # التحقق من أن الكائن ينتمي إلى نفس المؤسسة
        if hasattr(obj, 'organization'):
            return obj.organization == request.user.organization
        
        # إذا كان الكائن مستخدم
        if isinstance(obj, User):
            return obj.organization == request.user.organization
            
        return False


class IsProjectOwner(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو مالك المشروع
    مالك المشروع لديه تحكم كامل بالمشروع والمهام التابعة له
    """
    
    def has_permission(self, request, view):
        # التحقق من أن المستخدم مسجل الدخول وله مؤسسة
        if not request.user.is_authenticated:
            return False
            
        # التحقق من أن المستخدم لديه مؤسسة
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
            
        return True
    
    def has_object_permission(self, request, view, obj):
        # التحقق من أن الكائن ينتمي إلى نفس المؤسسة
        if hasattr(obj, 'organization') and obj.organization != request.user.organization:
            return False
        
        # التحقق من نوع الكائن (مشروع أو مهمة)
        from tasks.models import Task
        from projects.models import Project
        
        # إذا كان المستخدم أدمن، لديه صلاحية على جميع المشاريع والمهام في مؤسسته
        if request.user.is_admin:
            return True
            
        if isinstance(obj, Task):
            # إذا كان الكائن مهمة، نتحقق من مالك المشروع المرتبط بها
            return hasattr(obj.project, 'owner') and obj.project.owner == request.user
        elif isinstance(obj, Project):
            # إذا كان الكائن مشروعاً
            return hasattr(obj, 'owner') and obj.owner == request.user
        
        return False


class IsTaskAssignee(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو المعين عليه المهمة
    المعين على المهمة يستطيع تغيير حالتها فقط
    """
    
    def has_permission(self, request, view):
        # التحقق من أن المستخدم مسجل الدخول وله مؤسسة
        if not request.user.is_authenticated:
            return False
            
        # التحقق من أن المستخدم لديه مؤسسة
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
            
        return True
    
    def has_object_permission(self, request, view, obj):
        # التحقق من أن المهمة تنتمي إلى نفس مؤسسة المستخدم
        if hasattr(obj, 'organization') and obj.organization != request.user.organization:
            return False
            
        # إذا كان المستخدم أدمن، لديه صلاحية على جميع المهام في مؤسسته
        if request.user.is_admin:
            return True
            
        # إذا كان المستخدم مالك المشروع
        if hasattr(obj, 'project') and hasattr(obj.project, 'owner') and obj.project.owner == request.user:
            return True
            
        # إذا كان المستخدم هو المعين على المهمة
        if hasattr(obj, 'assignee') and obj.assignee == request.user:
            # إذا كان الطلب لتغيير حالة المهمة فقط
            if request.method == 'PATCH' and set(request.data.keys()) == {'status'}:
                return True
                
        return False


class IsSystemAdmin(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو مشرف النظام
    """
    
    def has_permission(self, request, view):
        # التحقق من أن المستخدم هو مشرف النظام
        return request.user.is_authenticated and request.user.is_admin


class IsUserOrAdmin(permissions.BasePermission):
    """
    التحقق من أن المستخدم هو صاحب الحساب أو مشرف
    """
    
    def has_object_permission(self, request, view, obj):
        # التحقق من أن المستخدم هو صاحب الحساب أو مشرف
        return obj.id == request.user.id or request.user.is_admin
