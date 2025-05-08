import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

User = get_user_model()


class AuthWebsocketConsumer(AsyncJsonWebsocketConsumer):
    """
    مستهلك WebSocket عام مع دعم المصادقة
    يستخدم للاتصالات العامة وإرسال التحديثات للمستخدم
    """
    
    async def connect(self):
        """
        إنشاء اتصال WebSocket والتحقق من المصادقة
        """
        # الحصول على رمز المصادقة من معلمات الاستعلام
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        token = query_params.get('token', None)
        
        # التحقق من وجود الرمز
        if not token:
            print("لا يوجد رمز مصادقة")
            await self.close(code=4001)
            return
        
        # التحقق من صحة الرمز والحصول على المستخدم
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            
            if not self.user:
                print(f"المستخدم غير موجود: {user_id}")
                await self.close(code=4002)
                return
                
            print(f"تم المصادقة للمستخدم: {self.user.username}")
            
            # إنشاء اسم المجموعة الخاصة بالمستخدم
            self.user_group = f'user_{self.user.id}'
            
            # الانضمام إلى مجموعة المستخدم
            await self.channel_layer.group_add(
                self.user_group,
                self.channel_name
            )
            
            # قبول الاتصال
            await self.accept()
            
            # إرسال رسالة ترحيب
            await self.send_json({
                'type': 'connection_established',
                'message': 'تم الاتصال بنجاح',
                'user': {
                    'id': self.user.id,
                    'username': self.user.username,
                }
            })
            
        except (TokenError, InvalidToken) as e:
            print(f"خطأ في المصادقة: {str(e)}")
            await self.close(code=4003)
        except Exception as e:
            print(f"خطأ غير متوقع: {str(e)}")
            await self.close(code=4000)
    
    async def disconnect(self, close_code):
        """
        قطع الاتصال من مجموعة WebSocket
        """
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
    
    async def receive_json(self, content):
        """
        استقبال رسالة من WebSocket
        """
        message_type = content.get('type')
        
        if message_type == 'ping':
            await self.send_json({
                'type': 'pong',
                'timestamp': content.get('timestamp')
            })
        elif message_type == 'subscribe':
            # الاشتراك في تحديثات مشروع
            project_id = content.get('project_id')
            if project_id:
                project_group = f'project_{project_id}'
                await self.channel_layer.group_add(
                    project_group,
                    self.channel_name
                )
                await self.send_json({
                    'type': 'subscribed',
                    'project_id': project_id
                })
        elif message_type == 'unsubscribe':
            # إلغاء الاشتراك من تحديثات مشروع
            project_id = content.get('project_id')
            if project_id:
                project_group = f'project_{project_id}'
                await self.channel_layer.group_discard(
                    project_group,
                    self.channel_name
                )
                await self.send_json({
                    'type': 'unsubscribed',
                    'project_id': project_id
                })
    
    async def project_update(self, event):
        """
        إرسال تحديث المشروع إلى WebSocket
        """
        await self.send_json({
            'type': 'project_update',
            'project': event['project']
        })
    
    async def project_created(self, event):
        """
        إرسال إشعار بإنشاء مشروع جديد
        """
        await self.send_json({
            'type': 'project_created',
            'project': event['project']
        })
    
    async def project_deleted(self, event):
        """
        إرسال إشعار بحذف مشروع
        """
        await self.send_json({
            'type': 'project_deleted',
            'project_id': event['project_id']
        })
    
    async def task_update(self, event):
        """
        إرسال تحديث المهمة إلى WebSocket
        """
        await self.send_json({
            'type': 'task_update',
            'task': event['task']
        })
    
    async def task_created(self, event):
        """
        إرسال إشعار بإنشاء مهمة جديدة
        """
        await self.send_json({
            'type': 'task_created',
            'task': event['task']
        })
    
    async def task_deleted(self, event):
        """
        إرسال إشعار بحذف مهمة
        """
        await self.send_json({
            'type': 'task_deleted',
            'task_id': event['task_id']
        })
    
    @database_sync_to_async
    def get_user(self, user_id):
        """
        الحصول على المستخدم من قاعدة البيانات
        """
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
