from rest_framework import permissions

class IsSystemOwner(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم هو مالك النظام
    """
    message = "يجب أن تكون مالك النظام للوصول إلى هذا المورد"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_system_owner

class IsOrgAdmin(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم هو مشرف في مؤسسته
    """
    message = "يجب أن تكون مشرف في مؤسستك للوصول إلى هذا المورد"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin

class IsOrgAdminOrSystemOwner(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم هو مشرف في مؤسسته أو مالك النظام
    """
    message = "يجب أن تكون مشرف في مؤسستك أو مالك النظام للوصول إلى هذا المورد"

    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_admin or request.user.is_system_owner)

class IsSameOrganization(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم ينتمي إلى نفس المؤسسة
    """
    message = "لا يمكنك الوصول إلى موارد من مؤسسة أخرى"

    def has_object_permission(self, request, view, obj):
        # التحقق من أن المستخدم ينتمي إلى نفس المؤسسة التي ينتمي إليها الكائن
        if hasattr(obj, 'organization'):
            return obj.organization == request.user.organization
        elif hasattr(obj, 'project') and hasattr(obj.project, 'organization'):
            return obj.project.organization == request.user.organization
        return False

class IsSystemOwnerOrSameOrganization(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم هو مالك النظام أو ينتمي إلى نفس المؤسسة
    """
    message = "يجب أن تكون مالك النظام أو تنتمي إلى نفس المؤسسة للوصول إلى هذا المورد"

    def has_object_permission(self, request, view, obj):
        # إذا كان المستخدم هو مالك النظام، فلديه الوصول إلى كل شيء
        if request.user.is_system_owner:
            return True
            
        # التحقق من أن المستخدم ينتمي إلى نفس المؤسسة التي ينتمي إليها الكائن
        if hasattr(obj, 'organization'):
            return obj.organization == request.user.organization
        elif hasattr(obj, 'project') and hasattr(obj.project, 'organization'):
            return obj.project.organization == request.user.organization
        return False

class IsSystemOwnerOrSelf(permissions.BasePermission):
    """
    صلاحية للتحقق من أن المستخدم هو مالك النظام أو يقوم بتعديل بياناته الشخصية
    """
    message = "يمكنك فقط تعديل بياناتك الشخصية أو أن تكون مالك النظام"

    def has_object_permission(self, request, view, obj):
        # إذا كان المستخدم هو مالك النظام، فلديه الوصول إلى كل شيء
        if request.user.is_system_owner:
            return True
            
        # التحقق من أن المستخدم يقوم بتعديل بياناته الشخصية
        return obj.id == request.user.id
