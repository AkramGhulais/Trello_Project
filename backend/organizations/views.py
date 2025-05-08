from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from .models import Organization
from .serializers import OrganizationSerializer
from users.permissions import IsSystemOwner, IsOrgAdmin, IsOrgAdminOrSystemOwner, IsSameOrganization, IsSystemOwnerOrSameOrganization
from projects.models import Project
from projects.serializers import ProjectSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    وجهة API للمؤسسات
    """
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        # إذا كان المستخدم هو مالك النظام، يرى جميع المؤسسات
        if self.request.user.is_system_owner:
            return Organization.objects.all()
        # إذا كان المستخدم مشرفاً أو عادياً، يرى فقط مؤسسته
        elif self.request.user.organization:
            return Organization.objects.filter(id=self.request.user.organization.id)
        # إذا لم يكن لدى المستخدم مؤسسة، يرجع قائمة فارغة
        else:
            return Organization.objects.none()
    
    def get_permissions(self):
        """
        تحديد الصلاحيات بناءً على نوع الطلب
        - إنشاء: مالك النظام فقط
        - قراءة: أي مستخدم مسجل (يرى فقط مؤسسته، إلا إذا كان مالك النظام)
        - تعديل/حذف: مالك النظام فقط
        """
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsSystemOwner]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsSystemOwner]
        elif self.action == 'org_projects':
            permission_classes = [permissions.IsAuthenticated, IsSystemOwnerOrSameOrganization]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
        
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsSystemOwnerOrSameOrganization])
    def org_projects(self, request, pk=None):
        """
        الحصول على مشاريع مؤسسة محددة
        """
        organization = self.get_object()
        
        # التحقق من أن المستخدم لديه صلاحية لرؤية مشاريع هذه المؤسسة
        if not request.user.is_system_owner and request.user.organization.id != organization.id:
            return Response({"error": "لا يمكنك الوصول إلى مشاريع مؤسسة أخرى"}, status=status.HTTP_403_FORBIDDEN)
        
        # جلب مشاريع المؤسسة
        projects = Project.objects.filter(organization=organization)
        serializer = ProjectSerializer(projects, many=True)
        
        return Response(serializer.data)


class PublicOrganizationsView(APIView):
    """
    واجهة API عامة للحصول على قائمة المؤسسات المتاحة للتسجيل
    لا تتطلب مصادقة
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            # جلب جميع المؤسسات
            organizations = Organization.objects.all()
            serializer = OrganizationSerializer(organizations, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"حدث خطأ أثناء جلب المؤسسات: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
