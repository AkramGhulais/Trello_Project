import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class TaskConsumer(AsyncJsonWebsocketConsumer):
    """
    مستهلك WebSocket للمهام
    يسمح بالتحديثات اللحظية للمهام في المشروع
    """
    
    async def connect(self):
        """
        الاتصال بمجموعة WebSocket للمشروع
        """
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.group_name = f'project_{self.project_id}'
        
        # التحقق من المصادقة
        if self.scope['user'].is_anonymous:
            await self.close()
            return
        
        # التحقق من أن المستخدم ينتمي إلى المؤسسة التي تملك المشروع
        if not await self.can_access_project(self.project_id, self.scope['user']):
            await self.close()
            return
        
        # الانضمام إلى مجموعة المشروع
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """
        قطع الاتصال من مجموعة WebSocket
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive_json(self, content):
        """
        استقبال رسالة من WebSocket
        """
        message_type = content.get('type')
        
        if message_type == 'task_update':
            # إعادة إرسال تحديث المهمة إلى المجموعة
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'task_update',
                    'task': content.get('task')
                }
            )
    
    async def task_update(self, event):
        """
        إرسال تحديث المهمة إلى WebSocket
        """
        await self.send_json({
            'type': 'task_update',
            'task': event['task']
        })
    
    async def task_delete(self, event):
        """
        إرسال حذف المهمة إلى WebSocket
        """
        await self.send_json({
            'type': 'task_delete',
            'task_id': event['task_id']
        })
    
    @database_sync_to_async
    def can_access_project(self, project_id, user):
        """
        التحقق من أن المستخدم يمكنه الوصول إلى المشروع
        """
        from projects.models import Project
        
        try:
            project = Project.objects.get(id=project_id)
            return project.organization == user.organization
        except Project.DoesNotExist:
            return False
