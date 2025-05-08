from rest_framework import serializers
from .models import User
from organizations.serializers import OrganizationSerializer
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    organization_detail = OrganizationSerializer(source='organization', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_admin', 'is_system_owner', 'organization', 'organization_detail', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    is_admin = serializers.BooleanField(required=False, default=False)
    is_system_owner = serializers.BooleanField(required=False, default=False, read_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'organization', 'is_admin', 'is_system_owner']
        extra_kwargs = {
            'username': {'required': True},
            'organization': {'required': True},
            'is_admin': {'required': False},
            'is_system_owner': {'required': False, 'read_only': True}
        }
    
    def validate_username(self, value):
        # التحقق من أن اسم المستخدم فريد
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("اسم المستخدم موجود بالفعل")
        # التحقق من أن اسم المستخدم يحتوي على أحرف صالحة فقط
        if not value.isalnum() and '_' not in value:
            raise serializers.ValidationError("اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط")
        return value
    
    def validate_email(self, value):
        # التحقق من أن البريد الإلكتروني فريد
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("البريد الإلكتروني مستخدم بالفعل")
        return value
    
    def validate_password(self, value):
        # التحقق من أن كلمة المرور قوية
        if len(value) < 8:
            raise serializers.ValidationError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return value
    
    def create(self, validated_data):
        try:
            # استخراج كلمة المرور من البيانات
            password = validated_data.pop('password')
            
            # التحقق من وجود مؤسسة
            if 'organization' not in validated_data or not validated_data['organization']:
                # إنشاء مؤسسة افتراضية إذا لم تكن موجودة
                from organizations.models import Organization
                default_org, created = Organization.objects.get_or_create(name="مؤسسة افتراضية")
                validated_data['organization'] = default_org
            
            # التحقق مما إذا كان هذا أول مستخدم في النظام
            is_first_user = User.objects.count() == 0
            
            # إنشاء المستخدم
            user = User(**validated_data)
            user.set_password(password)
            
            # إذا كان هذا أول مستخدم، يتم تعيينه كمالك للنظام
            if is_first_user:
                user.is_system_owner = True
                
            user.save()
            return user
        except Exception as e:
            raise serializers.ValidationError(f"حدث خطأ أثناء إنشاء المستخدم: {str(e)}")


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    current_password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'current_password', 'organization', 'is_admin', 'is_system_owner']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'organization': {'required': False},
            'is_admin': {'required': False},
            'is_system_owner': {'required': False}
        }
    
    def validate(self, data):
        # التحقق من كلمة المرور الحالية إذا تم تقديم كلمة مرور جديدة
        if 'password' in data and not self.context['request'].user.is_admin:
            if 'current_password' not in data:
                raise serializers.ValidationError({
                    'current_password': 'يجب توفير كلمة المرور الحالية لتغيير كلمة المرور'
                })
            if not self.instance.check_password(data['current_password']):
                raise serializers.ValidationError({
                    'current_password': 'كلمة المرور الحالية غير صحيحة'
                })
        
        # التحقق من اسم المستخدم الفريد
        if 'username' in data and data['username'] != self.instance.username:
            if User.objects.filter(username=data['username']).exists():
                raise serializers.ValidationError({
                    'username': 'اسم المستخدم موجود بالفعل'
                })
        
        # التحقق من البريد الإلكتروني الفريد
        if 'email' in data and data['email'] != self.instance.email:
            if User.objects.filter(email=data['email']).exists():
                raise serializers.ValidationError({
                    'email': 'البريد الإلكتروني مستخدم بالفعل'
                })
        
        # التحقق من قوة كلمة المرور
        if 'password' in data:
            if len(data['password']) < 8:
                raise serializers.ValidationError({
                    'password': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
                })
            if not any(char.isupper() for char in data['password']):
                raise serializers.ValidationError({
                    'password': 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'
                })
            if not any(char.isdigit() for char in data['password']):
                raise serializers.ValidationError({
                    'password': 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'
                })
        
        return data
    
    def update(self, instance, validated_data):
        # إزالة كلمة المرور الحالية إذا كانت موجودة
        if 'current_password' in validated_data:
            validated_data.pop('current_password')
        
        # تعيين كلمة المرور الجديدة إذا كانت موجودة
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        # التحقق من تغيير حالة is_system_owner
        request = self.context.get('request')
        if 'is_system_owner' in validated_data:
            # فقط المالك الحالي يمكنه تغيير حالة is_system_owner
            if not request.user.is_system_owner:
                # إذا لم يكن المستخدم هو المالك، نزيل هذا الحقل من التحديث
                validated_data.pop('is_system_owner')
            elif instance.id != request.user.id and validated_data['is_system_owner']:
                # لا يمكن تعيين مستخدم آخر كمالك للنظام
                validated_data.pop('is_system_owner')
        
        # تحديث الحقول الأخرى
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
