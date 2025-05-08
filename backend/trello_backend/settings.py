import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv
from decouple import config
import dj_database_url

load_dotenv()  # لتحميل متغيرات .env


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# استخدام متغيرات البيئة للإعدادات الحساسة
from decouple import config

# # SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = config('SECRET_KEY')  # بدون قيمة افتراضية ضعيفة

# # SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = config('DEBUG', default=True, cast=bool)

# ALLOWED_HOSTS = ['*']



# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')  # تأكد من أنه تم تعيينه في ملف .env

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)  # تأكد من أنه False في الإنتاج

# ALLOWED_HOSTS should be properly configured in production
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

DATABASE_URL = config('DATABASE_URL')

# Application definition

ROOT_URLCONF = 'trello_backend.urls'
WSGI_APPLICATION = 'trello_backend.wsgi.application'




INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    
    
    # Local apps
    'organizations.apps.OrganizationsConfig',
    'users.apps.UsersConfig',
    'projects',
    'tasks',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware should be as high as possible
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'projects.middleware.ProjectErrorMiddleware',  # وسيط معالجة الأخطاء الخاص بنا
    
]

# Templates configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': config('DB_NAME', default='Trello_Project'),       # اسم قاعدة البيانات
#         'USER': config('DB_USER', default='postgres'),            # اسم المستخدم
#         'PASSWORD': config('DB_PASSWORD', default='postgres'),    # كلمة المرور الافتراضية
#         'HOST': config('DB_HOST', default='localhost'),         # أو عنوان الخادم
#         'PORT': config('DB_PORT', default='5432'),              # المنفذ الافتراضي لـ PostgreSQL
#         'OPTIONS': {
#             'connect_timeout': 10,
#             'client_encoding': 'UTF8'
#         },
#     }
# }


DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL')
    )
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'users.User'

# Static files (CSS, JavaScript, Images)

STATIC_URL = '/static/'  # المسار العام للوصول إلى الملفات الثابتة
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # المجلد الذي سيتم تجميع الملفات فيه في بيئة الإنتاج
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # تغيير هذا للسماح بجميع الأصول أثناء التطوير
CORS_ALLOW_CREDENTIALS = True

# السماح بجميع الأصول والطرق والرؤوس
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",  # Vite الافتراضي
    "http://127.0.0.1:5173",
    "http://localhost:8080",  # منافذ أخرى شائعة
    "http://127.0.0.1:8080",
]

# السماح بأي منفذ محلي
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://localhost:[0-9]+$",
    r"^https?://127\.0\.0\.1:[0-9]+$",
]

# السماح بجميع الطرق
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# السماح بجميع الرؤوس
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',
    'access-control-allow-headers',
    'access-control-allow-methods',
]

# Channels settings
ASGI_APPLICATION = 'trello_backend.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}


