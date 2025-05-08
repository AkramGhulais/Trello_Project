from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        """
        تسجيل إشارات التطبيق عند بدء تشغيله
        """
        import users.signals
