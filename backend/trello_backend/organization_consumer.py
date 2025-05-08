import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class OrganizationConsumer(AsyncJsonWebsocketConsumer):
    """
    مستهلك WebSocket للمؤسسات
    يسمح بالتحديثات اللحظية للمهام والمشاريع داخل المؤسسة
    كل مؤسسة لها غرفة (Room) خاصة بها
    """
    
    async def connect(self):
        """
        الاتصال بمجموعة WebSocket للمؤسسة
        """
        self.organization_slug = self.scope['url_route']['kwargs']['organization_slug']
        self.group_name = f'org_{self.organization_slug}'
        
        # التحقق من المصادقة
        if self.scope['user'].is_anonymous:
            await self.close()
            return
        
        # التحقق من أن المستخدم ينتمي إلى المؤسسة
        if not await self.can_access_organization(self.organization_slug, self.scope['user']):
            await self.close()
            return
        
        # الانضمام إلى مجموعة المؤسسة
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # إرسال رسالة ترحيب
        await self.send_json({
            'type': 'welcome',
            'message': f'مرحباً بك في غرفة المؤسسة: {self.organization_slug}'
        })
    
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
        elif message_type == 'project_update':
            # إعادة إرسال تحديث المشروع إلى المجموعة
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'project_update',
                    'project': content.get('project')
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
    
    async def task_create(self, event):
        """
        إرسال إشعار إنشاء مهمة جديدة إلى WebSocket
        """
        await self.send_json({
            'type': 'task_create',
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
    
    async def project_update(self, event):
        """
        إرسال تحديث المشروع إلى WebSocket
        """
        await self.send_json({
            'type': 'project_update',
            'project': event['project']
        })
    
    async def project_create(self, event):
        """
        إرسال إشعار إنشاء مشروع جديد إلى WebSocket
        """
        await self.send_json({
            'type': 'project_create',
            'project': event['project']
        })
    
    async def project_delete(self, event):
        """
        إرسال حذف المشروع إلى WebSocket
        """
        await self.send_json({
            'type': 'project_delete',
            'project_id': event['project_id']
        })
    
    @database_sync_to_async
    def can_access_organization(self, organization_slug, user):
        """
        التحقق من أن المستخدم ينتمي إلى المؤسسة
        """
        from organizations.models import Organization
        
        try:
            organization = Organization.objects.get(slug=organization_slug)
            return organization == user.organization
        except Organization.DoesNotExist:
            return False
