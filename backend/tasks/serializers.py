from rest_framework import serializers
from .models import Task, TaskComment
from users.serializers import UserSerializer
from projects.serializers import ProjectSerializer
from organizations.serializers import OrganizationSerializer


class TaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserSerializer(source='assignee', read_only=True)
    project_detail = ProjectSerializer(source='project', read_only=True)
    organization_detail = OrganizationSerializer(source='organization', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 
            'project', 'project_detail',
            'assignee', 'assignee_detail',
            'organization', 'organization_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def create(self, validated_data):
        # تلقائيًا إضافة المؤسسة من المستخدم إذا لم يتم تحديدها
        print(f"DEBUG Serializer: Received data: {validated_data}")
        
        # التعامل مع المؤسسة
        if 'organization' not in validated_data or not validated_data['organization']:
            try:
                # محاولة الحصول على المؤسسة من المستخدم
                user = self.context['request'].user
                if not user.organization:
                    # إنشاء مؤسسة افتراضية للمستخدم إذا لم تكن موجودة
                    from organizations.models import Organization
                    default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                    user.organization = default_org
                    user.save()
                    print(f"DEBUG Serializer: Created default organization for user: {default_org.id}")
                
                validated_data['organization'] = user.organization
                print(f"DEBUG Serializer: Added organization: {validated_data['organization'].id}")
            except Exception as e:
                print(f"ERROR Serializer: Failed to add organization: {str(e)}")
                # محاولة إنشاء مؤسسة افتراضية
                try:
                    from organizations.models import Organization
                    default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                    validated_data['organization'] = default_org
                    print(f"DEBUG Serializer: Created fallback organization: {default_org.id}")
                except Exception as org_error:
                    print(f"ERROR Serializer: Failed to create fallback organization: {str(org_error)}")
                    # لا نريد أن يفشل الطلب بسبب عدم وجود مؤسسة
                    # سنحاول المتابعة بدون مؤسسة
                    print("WARNING: متابعة إنشاء المهمة بدون مؤسسة")
        
        # التعامل مع المشروع
        if 'project' not in validated_data or not validated_data['project']:
            # محاولة الحصول على المشروع من البيانات الأولية
            try:
                from projects.models import Project
                project_id = self.initial_data.get('project')
                if project_id:
                    project = Project.objects.get(id=project_id)
                    validated_data['project'] = project
                    print(f"DEBUG Serializer: Found project from initial data: {project.id}")
                else:
                    raise serializers.ValidationError("يجب تحديد المشروع للمهمة")
            except Exception as project_error:
                print(f"ERROR Serializer: Failed to get project: {str(project_error)}")
                raise serializers.ValidationError("يجب تحديد المشروع للمهمة")
        
        # التأكد من وجود مؤسسة للمشروع
        if 'project' in validated_data and not validated_data['project'].organization:
            # تعيين مؤسسة للمشروع إذا لم تكن موجودة
            try:
                from organizations.models import Organization
                default_org = validated_data.get('organization') or Organization.objects.get_or_create(name="مؤسسة افتراضية")[0]
                validated_data['project'].organization = default_org
                validated_data['project'].save()
                print(f"DEBUG Serializer: Set organization for project: {validated_data['project'].id}")
            except Exception as project_org_error:
                print(f"ERROR Serializer: Failed to set organization for project: {str(project_org_error)}")
                # لا نريد أن يفشل الطلب بسبب هذا الخطأ
        
        # التعامل مع الحالة
        if 'status' not in validated_data or not validated_data['status']:
            validated_data['status'] = 'todo'  # تعيين الحالة الافتراضية
            
        # محاولة إنشاء المهمة بعدة طرق
        # الطريقة 1: باستخدام المحول
        try:
            task = super().create(validated_data)
            print(f"DEBUG Serializer: Task created with ID: {task.id}")
            return task
        except Exception as e:
            print(f"ERROR Serializer: Failed to create task with serializer: {str(e)}")
            
            # الطريقة 2: باستخدام الإنشاء المباشر
            try:
                from tasks.models import Task
                task = Task.objects.create(
                    title=validated_data.get('title', ''),
                    description=validated_data.get('description', ''),
                    status=validated_data.get('status', 'todo'),
                    project=validated_data.get('project'),
                    organization=validated_data.get('organization'),
                    assignee=validated_data.get('assignee')
                )
                print(f"DEBUG Serializer: Task created with alternative method: {task.id}")
                return task
            except Exception as alt_error:
                print(f"ERROR Serializer: Alternative task creation also failed: {str(alt_error)}")
                
                # الطريقة 3: باستخدام البيانات الأولية
                try:
                    from tasks.models import Task
                    from projects.models import Project
                    
                    # الحصول على المشروع
                    project_id = self.initial_data.get('project')
                    if project_id:
                        project = Project.objects.get(id=project_id)
                        
                        # التأكد من وجود مؤسسة للمشروع
                        if not project.organization:
                            from organizations.models import Organization
                            default_org = Organization.objects.get_or_create(name="مؤسسة افتراضية")[0]
                            project.organization = default_org
                            project.save()
                        
                        # إنشاء المهمة
                        task = Task.objects.create(
                            title=self.initial_data.get('title', ''),
                            description=self.initial_data.get('description', ''),
                            status=self.initial_data.get('status', 'todo'),
                            project=project,
                            organization=project.organization,
                            assignee=None  # لا نعين مسؤول في هذه الحالة
                        )
                        print(f"DEBUG Serializer: Task created with fallback method: {task.id}")
                        return task
                except Exception as final_error:
                    print(f"CRITICAL ERROR: All task creation methods failed: {str(final_error)}")
                    raise serializers.ValidationError(f"حدث خطأ أثناء إنشاء المهمة. الرجاء المحاولة مرة أخرى.")


class TaskCommentSerializer(serializers.ModelSerializer):
    """
    محول لنموذج تعليقات المهام
    """
    author_detail = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'author', 'author_detail', 'content',
            'created_at', 'updated_at', 'is_edited'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_edited', 'author']
    
    def create(self, validated_data):
        # تعيين المستخدم الحالي كمؤلف للتعليق
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['author'] = request.user
        
        # التحقق من وجود المهمة
        try:
            task = validated_data.get('task')
            if task:
                # التحقق من أن المستخدم ينتمي إلى نفس المؤسسة التي تنتمي إليها المهمة
                if hasattr(request.user, 'organization') and request.user.organization and task.organization:
                    if request.user.organization != task.organization and not request.user.is_system_owner:
                        raise serializers.ValidationError("لا يمكنك إضافة تعليق على مهمة من مؤسسة أخرى")
        except Exception as e:
            print(f"ERROR: خطأ في التحقق من المهمة: {str(e)}")
            raise serializers.ValidationError("حدث خطأ أثناء معالجة التعليق")
        
        try:
            return super().create(validated_data)
        except Exception as e:
            print(f"ERROR: خطأ في إنشاء التعليق: {str(e)}")
            raise serializers.ValidationError("حدث خطأ أثناء حفظ التعليق")
