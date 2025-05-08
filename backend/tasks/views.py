from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer
from .permissions import IsCommentAuthor, CanDeleteComment
from trello_backend.permissions import IsSameOrganization, IsProjectOwner, IsTaskAssignee
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json


class TaskViewSet(viewsets.ModelViewSet):
    """
    وجهة API للمهام
    """
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        # المستخدم يرى فقط مهام مؤسسته
        try:
            # التحقق من وجود مؤسسة للمستخدم
            if not self.request.user.organization:
                from organizations.models import Organization
                # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
                default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                self.request.user.organization = default_org
                self.request.user.save()
                print(f"DEBUG: تم إنشاء مؤسسة افتراضية للمستخدم: {self.request.user.username}")
            
            # جلب المهام التابعة لمؤسسة المستخدم
            return Task.objects.filter(organization=self.request.user.organization)
        except Exception as e:
            print(f"ERROR: خطأ في جلب المهام: {str(e)}")
            # في حالة الخطأ، نعيد قائمة فارغة
            return Task.objects.none()
    
    def perform_create(self, serializer):
        # تعيين المؤسسة تلقائيًا للمهمة
        print(f"DEBUG: Creating task with data: {serializer.validated_data}")
        
        try:
            # التأكد من أن المستخدم لديه مؤسسة (هذا يجب أن يكون صحيحًا بسبب التحقق من الصلاحيات)
            if not self.request.user.organization:
                # إذا وصلنا إلى هنا، فهناك خطأ في الصلاحيات
                raise ValueError("لا يمكن إنشاء مهمة بدون مؤسسة للمستخدم")
            
            # التحقق من أن المشروع ينتمي إلى نفس مؤسسة المستخدم
            if 'project' in serializer.validated_data:
                project = serializer.validated_data['project']
                if project.organization != self.request.user.organization:
                    raise ValueError("لا يمكن إنشاء مهمة في مشروع من مؤسسة أخرى")
                    
            # تعيين مؤسسة المستخدم للمهمة
            organization = self.request.user.organization
            
            # محاولة إنشاء المهمة
            try:
                # تعيين المؤسسة بشكل صريح للمهمة
                task = serializer.save(organization=organization)
                print(f"DEBUG: Task created successfully: {task.id} in organization: {organization.name}")
                
                # محاولة إرسال تحديث عبر WebSocket
                try:
                    channel_layer = get_channel_layer()
                    # إرسال إلى غرفة المشروع
                    async_to_sync(channel_layer.group_send)(
                        f'project_{task.project.id}',
                        {
                            'type': 'task_create',
                            'task': TaskSerializer(task).data
                        }
                    )
                    
                    # إرسال إلى غرفة المؤسسة
                    if task.organization and task.organization.slug:
                        async_to_sync(channel_layer.group_send)(
                            f'org_{task.organization.slug}',
                            {
                                'type': 'task_create',
                                'task': TaskSerializer(task).data
                            }
                        )
                except Exception as ws_error:
                    print(f"WARNING: خطأ في إرسال تحديث WebSocket: {str(ws_error)}")
                    # لا نريد أن يفشل إنشاء المهمة بسبب خطأ في WebSocket
                
                return task
            except Exception as serializer_error:
                print(f"ERROR: خطأ في حفظ المهمة باستخدام المحول: {str(serializer_error)}")
                
                # محاولة إنشاء المهمة مباشرة
                from .models import Task
                task = Task.objects.create(
                    title=serializer.validated_data.get('title', ''),
                    description=serializer.validated_data.get('description', ''),
                    status=serializer.validated_data.get('status', 'todo'),
                    project=serializer.validated_data.get('project'),
                    organization=self.request.user.organization,
                    assignee=serializer.validated_data.get('assignee')
                )
                print(f"DEBUG: تم إنشاء المهمة بالطريقة البديلة: {task.id}")
                return task
        except Exception as e:
            print(f"ERROR: خطأ عام في إنشاء المهمة: {str(e)}")
            # محاولة أخيرة لإنشاء المهمة
            try:
                from .models import Task
                from projects.models import Project
                
                # الحصول على المشروع
                project_id = serializer.initial_data.get('project')
                if project_id:
                    project = Project.objects.get(id=project_id)
                    
                    # إنشاء المهمة
                    task = Task.objects.create(
                        title=serializer.initial_data.get('title', ''),
                        description=serializer.initial_data.get('description', ''),
                        status=serializer.initial_data.get('status', 'todo'),
                        project=project,
                        organization=self.request.user.organization
                    )
                    print(f"DEBUG: تم إنشاء المهمة بالطريقة الاحتياطية: {task.id}")
                    return task
            except Exception as final_error:
                print(f"CRITICAL ERROR: فشلت جميع محاولات إنشاء المهمة: {str(final_error)}")
                raise
    
    def get_permissions(self):
        """
        تحديد الصلاحيات بناءً على نوع الطلب
        - قراءة: أي مستخدم من نفس المؤسسة
        - إنشاء مهمة: أي عضو داخل المشروع
        - تعديل مهمة: فقط المعين أو مالك المشروع أو أدمن
        - تغيير حالة المهمة: فقط المعين
        - حذف المهمة: فقط المالك أو الأدمن
        """
        # التحقق من أن المستخدم مسجل الدخول ومن نفس المؤسسة (قاعدة العزل الأساسية)
        base_permissions = [permissions.IsAuthenticated, IsSameOrganization]
        
        if self.action == 'destroy':
            # حذف المهمة: فقط مالك المشروع أو أدمن
            permission_classes = base_permissions + [IsProjectOwner]
        elif self.action in ['update', 'partial_update']:
            # تعديل المهمة: المعين أو مالك المشروع أو أدمن
            # إذا كان التعديل لحالة المهمة فقط، فالمعين يستطيع ذلك
            # سيتم التحقق من ذلك في IsTaskAssignee.has_object_permission
            permission_classes = base_permissions + [IsTaskAssignee]
        elif self.action == 'create':
            # إنشاء مهمة: أي مستخدم داخل المؤسسة
            permission_classes = base_permissions
        else:
            # قراءة وعمليات أخرى: أي مستخدم من نفس المؤسسة
            permission_classes = base_permissions
        
        return [permission() for permission in permission_classes]
    
    def perform_update(self, serializer):
        # حفظ المهمة
        task = serializer.save()
        
        # إرسال تحديث عبر WebSocket
        try:
            channel_layer = get_channel_layer()
            
            # إرسال إلى غرفة المشروع
            async_to_sync(channel_layer.group_send)(
                f'project_{task.project.id}',
                {
                    'type': 'task_update',
                    'task': TaskSerializer(task).data
                }
            )
            
            # إرسال إلى غرفة المؤسسة
            if task.organization and task.organization.slug:
                async_to_sync(channel_layer.group_send)(
                    f'org_{task.organization.slug}',
                    {
                        'type': 'task_update',
                        'task': TaskSerializer(task).data
                    }
                )
        except Exception as ws_error:
            print(f"WARNING: خطأ في إرسال تحديث WebSocket: {str(ws_error)}")
            # لا نريد أن يفشل تحديث المهمة بسبب خطأ في WebSocket
    
    def perform_destroy(self, instance):
        # الحصول على معرف المشروع قبل الحذف
        project_id = instance.project.id
        task_id = instance.id
        organization_slug = instance.organization.slug if instance.organization else None
        
        # حذف المهمة
        instance.delete()
        
        # إرسال تحديث عبر WebSocket
        try:
            channel_layer = get_channel_layer()
            
            # إرسال إلى غرفة المشروع
            async_to_sync(channel_layer.group_send)(
                f'project_{project_id}',
                {
                    'type': 'task_delete',
                    'task_id': task_id
                }
            )
            
            # إرسال إلى غرفة المؤسسة
            if organization_slug:
                async_to_sync(channel_layer.group_send)(
                    f'org_{organization_slug}',
                    {
                        'type': 'task_delete',
                        'task_id': task_id
                    }
                )
        except Exception as ws_error:
            print(f"WARNING: خطأ في إرسال تحديث WebSocket: {str(ws_error)}")
            # لا نريد أن يفشل حذف المهمة بسبب خطأ في WebSocket


class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    وجهة API لتعليقات المهام
    """
    serializer_class = TaskCommentSerializer
    
    def get_queryset(self):
        # المستخدم يرى فقط تعليقات مؤسسته
        if self.request.user.is_system_owner:
            # مالك النظام يرى جميع التعليقات
            return TaskComment.objects.all()
        
        # التحقق من وجود مؤسسة للمستخدم
        if not hasattr(self.request.user, 'organization') or not self.request.user.organization:
            return TaskComment.objects.none()
        
        # جلب التعليقات التابعة لمؤسسة المستخدم
        return TaskComment.objects.filter(task__organization=self.request.user.organization)
    
    def get_permissions(self):
        """
        تحديد الصلاحيات بناءً على نوع الطلب
        صلاحيات التعليقات:
        - قراءة: أي مستخدم مسجل من نفس المؤسسة
        - إنشاء تعليق: أي مستخدم مسجل من نفس المؤسسة
        - تعديل تعليق: فقط مؤلف التعليق (الشخص الذي كتبه)
        - حذف تعليق: مؤلف التعليق أو مشرف المؤسسة أو مالك النظام
        """
        # التحقق من أن المستخدم مسجل الدخول ومن نفس المؤسسة
        base_permissions = [permissions.IsAuthenticated, IsSameOrganization]
        
        # تعيين الصلاحيات بناءً على نوع الإجراء
        if self.action == 'destroy':
            # حذف التعليق: مؤلف التعليق أو مشرف المؤسسة أو مالك النظام
            print(f"DEBUG: طلب حذف تعليق بواسطة {self.request.user.username}")
            permission_classes = base_permissions + [CanDeleteComment]
        elif self.action in ['update', 'partial_update']:
            # تعديل التعليق: فقط مؤلف التعليق
            print(f"DEBUG: طلب تعديل تعليق بواسطة {self.request.user.username}")
            permission_classes = base_permissions + [IsCommentAuthor]
        else:
            # قراءة وإنشاء: أي مستخدم من نفس المؤسسة
            permission_classes = base_permissions
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # حفظ التعليق مع تعيين المؤلف تلقائياً
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        # تعيين حالة التعديل
        serializer.save(is_edited=True)
    
    @action(detail=False, methods=['get'], url_path='task/(?P<task_id>[^/.]+)')
    def task_comments(self, request, task_id=None):
        """
        الحصول على جميع تعليقات مهمة محددة
        """
        try:
            # التحقق من وجود المهمة
            task = Task.objects.get(id=task_id)
            
            # التحقق من أن المستخدم ينتمي إلى نفس المؤسسة
            if not request.user.is_system_owner and task.organization != request.user.organization:
                return Response(
                    {"detail": "لا يمكنك الوصول إلى تعليقات مهمة من مؤسسة أخرى"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # جلب تعليقات المهمة
            comments = TaskComment.objects.filter(task=task)
            serializer = self.get_serializer(comments, many=True)
            
            return Response(serializer.data)
        except Task.DoesNotExist:
            return Response(
                {"detail": "المهمة غير موجودة"},
                status=status.HTTP_404_NOT_FOUND
            )
