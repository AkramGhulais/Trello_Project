from rest_framework import serializers
from .models import Project
from users.serializers import UserSerializer
from organizations.serializers import OrganizationSerializer


class ProjectSerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source='owner', read_only=True)
    organization_detail = OrganizationSerializer(source='organization', read_only=True)
    tasks_count = serializers.SerializerMethodField(read_only=True)
    completion_percentage = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'owner', 'owner_detail',
            'organization', 'organization_detail', 'created_at', 'updated_at',
            'tasks_count', 'completion_percentage'
        ]
        read_only_fields = ['id', 'owner', 'organization', 'created_at', 'updated_at', 'tasks_count', 'completion_percentage']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count() if hasattr(obj, 'tasks') else 0
    
    def get_completion_percentage(self, obj):
        if not hasattr(obj, 'tasks') or obj.tasks.count() == 0:
            return 0
        completed_tasks = obj.tasks.filter(status='done').count()
        total_tasks = obj.tasks.count()
        return int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    
    def create(self, validated_data):
        # تلقائيًا إضافة المؤسسة من المستخدم إذا لم يتم تحديدها
        if 'organization' not in validated_data and 'request' in self.context:
            validated_data['organization'] = self.context['request'].user.organization
        
        # التأكد من وجود العنوان
        if 'title' not in validated_data or not validated_data['title']:
            raise serializers.ValidationError({'title': 'عنوان المشروع مطلوب'})
        
        # إضافة وصف فارغ إذا لم يتم تحديده
        if 'description' not in validated_data:
            validated_data['description'] = ''
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # التأكد من وجود العنوان
        if 'title' in validated_data and not validated_data['title']:
            raise serializers.ValidationError({'title': 'عنوان المشروع مطلوب'})
        
        return super().update(instance, validated_data)
