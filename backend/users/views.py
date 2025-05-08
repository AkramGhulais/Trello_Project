from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from .permissions import IsSystemOwner, IsOrgAdmin, IsOrgAdminOrSystemOwner, IsSameOrganization, IsSystemOwnerOrSameOrganization, IsSystemOwnerOrSelf


class SignupView(APIView):
    """
    وجهة API لتسجيل مستخدم جديد
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            print(f"DEBUG: بيانات التسجيل المستلمة: {request.data}")
            
            # التحقق من البيانات المطلوبة
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in request.data or not request.data[field]:
                    return Response({field: f"حقل {field} مطلوب"}, status=status.HTTP_400_BAD_REQUEST)
            
            # التحقق من صحة البيانات
            serializer = UserCreateSerializer(data=request.data)
            if serializer.is_valid():
                # التحقق من وجود مؤسسة أو إنشاء مؤسسة افتراضية
                from organizations.models import Organization
                organization_id = request.data.get('organization')
                
                if organization_id:
                    try:
                        organization = Organization.objects.get(id=organization_id)
                    except Organization.DoesNotExist:
                        # إذا لم يتم العثور على المؤسسة المحددة، استخدام الطريقة الجديدة للحصول على المؤسسة الافتراضية
                        organization = Organization.get_or_create_default()
                        print(f"DEBUG: تم استخدام المؤسسة الافتراضية لعدم وجود المؤسسة المحددة: {organization.name} (slug: {organization.slug})")
                else:
                    # استخدام المؤسسة الافتراضية إذا لم يتم تحديد مؤسسة
                    organization = Organization.get_or_create_default()
                    print(f"DEBUG: تم استخدام المؤسسة الافتراضية: {organization.name} (slug: {organization.slug})")
                
                # حفظ المستخدم مع تعيين المؤسسة
                user = serializer.save(organization=organization)
                print(f"DEBUG: تم إنشاء المستخدم بنجاح: {user.username} في مؤسسة: {organization.name}")
                
                # إنشاء رمز المصادقة
                refresh = RefreshToken.for_user(user)
                
                # إرجاع الاستجابة
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"DEBUG: خطأ في التحقق من صحة البيانات: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"ERROR: خطأ غير متوقع في إنشاء المستخدم: {str(e)}")
            return Response({"error": f"حدث خطأ أثناء إنشاء الحساب: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserViewSet(viewsets.ModelViewSet):
    """
    وجهة API للمستخدمين
    """
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        print(f"DEBUG: جلب المستخدمين بواسطة {self.request.user.username}")
        print(f"DEBUG: المستخدم الحالي هو مشرف: {self.request.user.is_admin}")
        print(f"DEBUG: المستخدم الحالي هو مالك النظام: {self.request.user.is_system_owner}")
        
        try:
            # التحقق من وجود مؤسسة للمستخدم
            if not self.request.user.organization:
                from organizations.models import Organization
                # استخدام الطريقة الجديدة للحصول على المؤسسة الافتراضية
                default_org = Organization.get_or_create_default()
                self.request.user.organization = default_org
                self.request.user.save()
                print(f"DEBUG: تم تعيين مؤسسة افتراضية للمستخدم: {self.request.user.username} - {default_org.name} (slug: {default_org.slug})")
            
            print(f"DEBUG: مؤسسة المستخدم: {self.request.user.organization}")
            
            # إذا كان المستخدم هو مالك النظام، يمكنه رؤية جميع المستخدمين
            if self.request.user.is_system_owner:
                all_users = User.objects.all()
                print(f"DEBUG: مالك النظام يشاهد جميع المستخدمين: {all_users.count()}")
            # إذا كان المستخدم مشرف أو مستخدم عادي، يمكنه رؤية المستخدمين في مؤسسته فقط
            else:
                all_users = User.objects.filter(organization=self.request.user.organization)
                print(f"DEBUG: المستخدم يشاهد مستخدمي مؤسسته فقط: {all_users.count()}")
            
            # طباعة معلومات المستخدمين للتشخيص
            for user in all_users:
                print(f"DEBUG: معلومات المستخدم - الاسم: {user.username}, المعرف: {user.id}, مشرف: {user.is_admin}, مالك النظام: {user.is_system_owner}")
            
            return all_users
        except Exception as e:
            print(f"ERROR: خطأ في جلب المستخدمين: {str(e)}")
            # في حالة الخطأ، نعيد قائمة فارغة
            return User.objects.none()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def organization_users(self, request):
        """
        الحصول على قائمة المستخدمين في نفس مؤسسة المستخدم الحالي
        هذه الواجهة مفيدة عند إسناد المهام للمستخدمين
        """
        try:
            # التحقق من وجود مؤسسة للمستخدم
            if not request.user.organization:
                from organizations.models import Organization
                # استخدام الطريقة الجديدة للحصول على المؤسسة الافتراضية
                default_org = Organization.get_or_create_default()
                request.user.organization = default_org
                request.user.save()
                print(f"DEBUG: تم تعيين مؤسسة افتراضية للمستخدم: {request.user.username} - {default_org.name} (slug: {default_org.slug})")
            
            # جلب المستخدمين في نفس المؤسسة
            org_users = User.objects.filter(organization=request.user.organization)
            print(f"DEBUG: تم جلب {org_users.count()} مستخدم من مؤسسة {request.user.organization.name}")
            
            # إرجاع البيانات
            serializer = UserSerializer(org_users, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"ERROR: خطأ في جلب مستخدمي المؤسسة: {str(e)}")
            return Response(
                {"error": f"حدث خطأ أثناء جلب مستخدمي المؤسسة: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_permissions(self):
        """
        تحديد الصلاحيات بناءً على نوع الطلب
        - قراءة: أي مستخدم مسجل (يرى فقط مستخدمي مؤسسته، إلا إذا كان مالك النظام)
        - إنشاء: مشرف المؤسسة أو مالك النظام
        - تعديل/حذف: المستخدم نفسه أو مشرف المؤسسة أو مالك النظام
        - تغيير حالة المشرف: مشرف المؤسسة أو مالك النظام
        - تغيير حالة مالك النظام: مالك النظام فقط
        """
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsOrgAdminOrSystemOwner]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsSystemOwnerOrSelf]
        elif self.action == 'toggle_admin':
            permission_classes = [permissions.IsAuthenticated, IsOrgAdminOrSystemOwner]
        elif self.action == 'toggle_system_owner':
            permission_classes = [permissions.IsAuthenticated, IsSystemOwner]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # إذا لم يتم تحديد مؤسسة، استخدم مؤسسة المستخدم الحالي
        if 'organization' not in serializer.validated_data or not serializer.validated_data['organization']:
            serializer.validated_data['organization'] = self.request.user.organization
        serializer.save()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        الحصول على بيانات المستخدم الحالي
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgAdminOrSystemOwner])
    def toggle_admin(self, request, pk=None):
        """
        تغيير حالة المشرف للمستخدم
        """
        user = self.get_object()
        
        # التحقق من أن المستخدم في نفس المؤسسة إذا كان الطالب مشرف (وليس مالك النظام)
        if not request.user.is_system_owner and user.organization != request.user.organization:
            return Response({"error": "لا يمكنك تغيير حالة مشرف لمستخدم من مؤسسة أخرى"}, status=status.HTTP_403_FORBIDDEN)
            
        user.is_admin = not user.is_admin
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSystemOwner])
    def toggle_system_owner(self, request, pk=None):
        """
        تغيير حالة مالك النظام للمستخدم (متاح فقط لمالك النظام الحالي)
        """
        user = self.get_object()
        
        # التحقق من أن المستخدم الحالي هو مالك النظام
        if not request.user.is_system_owner:
            return Response({"error": "فقط مالك النظام يمكنه تغيير حالة مالك النظام"}, status=status.HTTP_403_FORBIDDEN)
            
        # التحقق من أن المستخدم الحالي هو نفسه الذي يتم تغيير حالته
        if request.user.id != user.id:
            return Response({"error": "يمكنك فقط تغيير حالة مالك النظام لنفسك"}, status=status.HTTP_403_FORBIDDEN)
            
        # تغيير حالة مالك النظام
        user.is_system_owner = not user.is_system_owner
        
        # إذا تم إلغاء حالة مالك النظام، نتحقق من وجود مالك آخر
        if not user.is_system_owner and User.objects.filter(is_system_owner=True).count() == 0:
            # تعيين أول مستخدم آخر كمالك للنظام
            other_user = User.objects.exclude(id=user.id).first()
            if other_user:
                other_user.is_system_owner = True
                other_user.save()
                return Response({"message": f"تم إلغاء حالة مالك النظام وتعيين {other_user.username} كمالك جديد للنظام"}, status=status.HTTP_200_OK)
            else:
                # إذا لم يكن هناك مستخدمين آخرين، نعيد تعيين المستخدم الحالي كمالك
                user.is_system_owner = True
                user.save()
                return Response({"error": "لا يمكن إلغاء حالة مالك النظام لأنه لا يوجد مستخدمين آخرين"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """
    وجهة API للحصول على بيانات المستخدم الحالي
    """
    try:
        # التحقق من وجود مؤسسة للمستخدم
        if not request.user.organization:
            from organizations.models import Organization
            # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
            default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
            request.user.organization = default_org
            request.user.save()
            print(f"DEBUG: تم إنشاء مؤسسة افتراضية للمستخدم: {request.user.username}")
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    except Exception as e:
        print(f"ERROR: خطأ في جلب بيانات المستخدم الحالي: {str(e)}")
        return Response({"error": f"حدث خطأ أثناء جلب بيانات المستخدم: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
