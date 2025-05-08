from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Project
from .serializers import ProjectSerializer
from tasks.serializers import TaskSerializer
from trello_backend.permissions import IsSameOrganization, IsProjectOwner
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class ProjectViewSet(viewsets.ModelViewSet):
    """
    وجهة API للمشاريع
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # إذا كان المستخدم هو مالك النظام، يرى جميع المشاريع
        if self.request.user.is_system_owner:
            return Project.objects.all()
            
        # المستخدم العادي يرى فقط مشاريع مؤسسته
        try:
            # التحقق من وجود مؤسسة للمستخدم
            if not self.request.user.organization:
                from organizations.models import Organization
                # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
                default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                self.request.user.organization = default_org
                self.request.user.save()
                print(f"تم إنشاء مؤسسة افتراضية للمستخدم: {self.request.user.username}")
            
            # إرجاع المشاريع التابعة لمؤسسة المستخدم
            return Project.objects.filter(organization=self.request.user.organization)
        except Exception as e:
            print(f"خطأ في get_queryset: {str(e)}")
            return Project.objects.none()  # إرجاع قائمة فارغة في حالة حدوث أي خطأ
    
    def create(self, request, *args, **kwargs):
        """
        إنشاء مشروع جديد مع معالجة أفضل للأخطاء
        """
        print(f"DEBUG: إنشاء مشروع جديد بواسطة المستخدم: {self.request.user.username}")
        print(f"DEBUG: البيانات المرسلة: {request.data}")
        
        try:
            # التحقق من صحة البيانات
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # إذا كان المستخدم هو مالك النظام
            if request.user.is_system_owner:
                # التحقق من وجود معرف المؤسسة في البيانات
                if 'organization' in request.data and request.data['organization']:
                    from organizations.models import Organization
                    try:
                        organization = Organization.objects.get(id=request.data['organization'])
                        project = serializer.save(owner=request.user, organization=organization)
                        print(f"DEBUG: تم إنشاء المشروع بنجاح للمؤسسة {organization.name}")
                    except Organization.DoesNotExist:
                        return Response({"error": "المؤسسة غير موجودة"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": "يجب تحديد المؤسسة لإنشاء مشروع"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # التحقق من وجود مؤسسة للمستخدم
                if not request.user.organization:
                    from organizations.models import Organization
                    # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
                    default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                    request.user.organization = default_org
                    request.user.save()
                    print(f"DEBUG: تم إنشاء مؤسسة افتراضية للمستخدم: {default_org.name}")
                
                # حفظ المشروع مع تعيين المالك والمؤسسة
                project = serializer.save(owner=request.user, organization=request.user.organization)
                print(f"DEBUG: تم إنشاء المشروع بنجاح: {project.id} - {project.title}")
            
            # إرجاع الاستجابة
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"ERROR: خطأ في إنشاء المشروع: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        # إذا كان المستخدم هو مالك النظام
        if self.request.user.is_system_owner:
            # التحقق من وجود معرف المؤسسة في البيانات
            if hasattr(serializer, 'validated_data') and 'organization' in serializer.validated_data:
                organization = serializer.validated_data['organization']
                project = serializer.save(owner=self.request.user)
                print(f"DEBUG: Project created successfully by system owner: {project.id} - {project.title} in organization: {organization.name}")
                return
            else:
                # هذا يجب أن يتم التحقق منه في طريقة create
                raise ValueError("يجب تحديد المؤسسة لإنشاء مشروع")
        else:
            # التأكد من أن المستخدم لديه مؤسسة (هذا يجب أن يكون صحيحًا بسبب التحقق من الصلاحيات)
            if not self.request.user.organization:
                # إذا وصلنا إلى هنا، فهناك خطأ في الصلاحيات
                raise ValueError("لا يمكن إنشاء مشروع بدون مؤسسة للمستخدم")
                
            # تعيين المستخدم الحالي كمالك للمشروع وتعيين المؤسسة
            project = serializer.save(owner=self.request.user, organization=self.request.user.organization)
            print(f"DEBUG: Project created successfully: {project.id} - {project.title} in organization: {project.organization.name}")
        
        # إرسال تحديث عبر WebSocket إلى غرفة المؤسسة
        try:
            if project.organization and project.organization.slug:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'org_{project.organization.slug}',
                    {
                        'type': 'project_create',
                        'project': ProjectSerializer(project).data
                    }
                )
                print(f"DEBUG: تم إرسال إشعار WebSocket بإنشاء المشروع بنجاح")
        except Exception as ws_error:
            print(f"WARNING: خطأ في إرسال إشعار WebSocket: {str(ws_error)}")
            # لا نريد أن يفشل إنشاء المشروع بسبب خطأ في WebSocket
    
    def perform_update(self, serializer):
        """
        تحديث المشروع وإرسال تحديث عبر WebSocket
        """
        # حفظ المشروع
        project = serializer.save()
        
        # إرسال تحديث عبر WebSocket إلى غرفة المؤسسة
        try:
            if project.organization and project.organization.slug:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'org_{project.organization.slug}',
                    {
                        'type': 'project_update',
                        'project': ProjectSerializer(project).data
                    }
                )
                print(f"DEBUG: تم إرسال إشعار WebSocket بتحديث المشروع بنجاح")
        except Exception as ws_error:
            print(f"WARNING: خطأ في إرسال إشعار WebSocket: {str(ws_error)}")
            # لا نريد أن يفشل تحديث المشروع بسبب خطأ في WebSocket
    
    def perform_destroy(self, instance):
        """
        حذف المشروع وإرسال تحديث عبر WebSocket
        """
        # الحصول على معلومات المشروع قبل الحذف
        project_id = instance.id
        organization_slug = instance.organization.slug if instance.organization else None
        
        # حذف المشروع
        instance.delete()
        
        # إرسال تحديث عبر WebSocket إلى غرفة المؤسسة
        try:
            if organization_slug:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'org_{organization_slug}',
                    {
                        'type': 'project_delete',
                        'project_id': project_id
                    }
                )
                print(f"DEBUG: تم إرسال إشعار WebSocket بحذف المشروع بنجاح")
        except Exception as ws_error:
            print(f"WARNING: خطأ في إرسال إشعار WebSocket: {str(ws_error)}")
            # لا نريد أن يفشل حذف المشروع بسبب خطأ في WebSocket
    
    def get_permissions(self):
        """
        تحديد الصلاحيات بناءً على نوع الطلب
        - قراءة: أي مستخدم من نفس المؤسسة
        - إنشاء: أي مستخدم داخل المؤسسة
        - تعديل/حذف: فقط مالك المشروع أو أدمن
        """
        # التحقق من أن المستخدم مسجل الدخول ومن نفس المؤسسة (قاعدة العزل الأساسية)
        base_permissions = [permissions.IsAuthenticated, IsSameOrganization]
        
        if self.action in ['update', 'partial_update', 'destroy']:
            # للتعديل والحذف: فقط مالك المشروع أو أدمن
            permission_classes = base_permissions + [IsProjectOwner]
        elif self.action == 'create':
            # للإنشاء: أي مستخدم داخل المؤسسة
            permission_classes = base_permissions
        else:
            # للقراءة والعمليات الأخرى: أي مستخدم من نفس المؤسسة
            permission_classes = base_permissions
        
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """
        الحصول على مهام المشروع
        """
        try:
            print(f"محاولة جلب مهام المشروع رقم: {pk}")
            project = self.get_object()
            print(f"تم العثور على المشروع: {project.id} - {project.title}")
            
            # التحقق من وجود مهام للمشروع
            tasks = project.tasks.all()
            print(f"تم العثور على {tasks.count()} مهمة للمشروع")
            
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"خطأ في جلب مهام المشروع: {str(e)}")
            return Response({"error": f"خطأ في جلب مهام المشروع: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def add_task(self, request, pk=None):
        """
        إضافة مهمة جديدة للمشروع
        """
        print(f"DEBUG: محاولة إضافة مهمة جديدة للمشروع رقم {pk}")
        print(f"DEBUG: البيانات المرسلة: {request.data}")
        print(f"DEBUG: نوع البيانات المرسلة: {type(request.data)}")
        print(f"DEBUG: المستخدم الحالي: {request.user.username}")
        
        # التحقق من وجود مؤسسة للمستخدم
        if not request.user.organization:
            from organizations.models import Organization
            # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
            default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
            request.user.organization = default_org
            request.user.save()
            print(f"DEBUG: تم إنشاء مؤسسة افتراضية للمستخدم: {request.user.username}")
        
        print(f"DEBUG: مؤسسة المستخدم: {request.user.organization}")
        
        try:
            # الحصول على المشروع بطريقة آمنة
            try:
                from projects.models import Project
                project = Project.objects.get(pk=pk)
                print(f"DEBUG: تم العثور على المشروع: {project.id} - {project.title}")
            except Project.DoesNotExist:
                return Response({"error": f"المشروع رقم {pk} غير موجود"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as project_error:
                print(f"ERROR: خطأ في الحصول على المشروع: {str(project_error)}")
                return Response({"error": f"خطأ في الحصول على المشروع: {str(project_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # التحقق من وجود مؤسسة للمشروع
            if not project.organization:
                project.organization = request.user.organization
                project.save()
                print(f"DEBUG: تم تعيين مؤسسة للمشروع: {project.organization.name}")
            
            # استخراج البيانات من الطلب
            title = request.data.get('title')
            if not title:
                return Response({"error": "عنوان المهمة مطلوب"}, status=status.HTTP_400_BAD_REQUEST)
            
            description = request.data.get('description', '')
            
            # التأكد من صحة الحالة
            status_value = request.data.get('status')
            valid_statuses = ['todo', 'in_progress', 'done']
            if not status_value or status_value not in valid_statuses:
                status_value = 'todo'  # تعيين القيمة الافتراضية
            
            # معالجة حقل المستخدم المسند إليه المهمة
            assignee = None
            assignee_id = request.data.get('assignee')
            if assignee_id and assignee_id != '':
                try:
                    from users.models import User
                    assignee = User.objects.get(id=assignee_id)
                    print(f"DEBUG: تم العثور على المستخدم المسند إليه المهمة: {assignee.username}")
                except User.DoesNotExist:
                    print(f"WARNING: لم يتم العثور على المستخدم رقم {assignee_id}")
                except Exception as user_error:
                    print(f"WARNING: خطأ في العثور على المستخدم: {str(user_error)}")
            
            # إنشاء المهمة باستخدام create
            try:
                from tasks.models import Task
                task = Task.objects.create(
                    title=title,
                    description=description,
                    status=status_value,
                    project=project,
                    organization=project.organization,
                    assignee=assignee
                )
                print(f"DEBUG: تم إنشاء المهمة بنجاح: {task.id} - {task.title}")
                
                # إرسال إشعار WebSocket إذا كان متاحًا
                try:
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync
                    from tasks.serializers import TaskSerializer
                    
                    channel_layer = get_channel_layer()
                    # إرسال إلى غرفة المشروع
                    async_to_sync(channel_layer.group_send)(
                        f'project_{project.id}',
                        {
                            'type': 'task_create',
                            'task': TaskSerializer(task).data
                        }
                    )
                    
                    # إرسال إلى غرفة المؤسسة
                    if project.organization and project.organization.slug:
                        async_to_sync(channel_layer.group_send)(
                            f'org_{project.organization.slug}',
                            {
                                'type': 'task_create',
                                'task': TaskSerializer(task).data
                            }
                        )
                    print(f"DEBUG: تم إرسال إشعار WebSocket بنجاح")
                except Exception as ws_error:
                    print(f"WARNING: خطأ في إرسال إشعار WebSocket: {str(ws_error)}")
                    # لا نريد أن يفشل إنشاء المهمة بسبب خطأ في WebSocket
                
                # إرسال الاستجابة
                from tasks.serializers import TaskSerializer
                return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
                
            except Exception as task_error:
                print(f"ERROR: خطأ في إنشاء المهمة: {str(task_error)}")
                
                # محاولة بديلة باستخدام serializer
                try:
                    from tasks.serializers import TaskSerializer
                    task_data = {
                        'title': title,
                        'description': description,
                        'status': status_value,
                        'project': project.id,
                        'organization': project.organization.id
                    }
                    if assignee:
                        task_data['assignee'] = assignee.id
                    
                    serializer = TaskSerializer(data=task_data, context={'request': request})
                    if serializer.is_valid():
                        task = serializer.save()
                        print(f"DEBUG: تم إنشاء المهمة باستخدام المحول: {task.id}")
                        return Response(serializer.data, status=status.HTTP_201_CREATED)
                    else:
                        print(f"ERROR: خطأ في التحقق من صحة البيانات: {serializer.errors}")
                        return Response({"error": "خطأ في التحقق من صحة البيانات", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as serializer_error:
                    print(f"ERROR: خطأ في إنشاء المهمة باستخدام المحول: {str(serializer_error)}")
                    return Response({"error": f"خطأ في إنشاء المهمة: {str(serializer_error)}"}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"ERROR: خطأ عام في إضافة المهمة: {str(e)}")
            return Response({"error": f"حدث خطأ أثناء إنشاء المهمة: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
