import { useState, useContext, useEffect } from 'react';
import { 
  Container, Box, Typography, Grid, Button, 
  Card, CardContent, TextField, Avatar, Divider,
  CircularProgress, Alert, Snackbar, Paper
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, fetchUserData } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // بيانات النموذج
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    organization: ''
  });
  
  // بيانات تغيير كلمة المرور
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // أخطاء النموذج
  const [errors, setErrors] = useState({});
  
  // تحميل بيانات المستخدم
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        organization: user.organization_detail?.name || ''
      });
    }
  }, [user]);
  
  // تحديث بيانات الملف الشخصي
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // تحديث بيانات كلمة المرور
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // التحقق من صحة بيانات الملف الشخصي
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.username) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    
    if (!profileData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  // التحقق من صحة بيانات تغيير كلمة المرور
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  // حفظ الملف الشخصي
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.patch(`/api/users/${user.id}/`, {
        username: profileData.username,
        email: profileData.email
      });
      
      // تحديث بيانات المستخدم في السياق
      await fetchUserData();
      
      showNotification('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      
      if (error.response?.data) {
        setErrors(prev => ({
          ...prev,
          ...error.response.data
        }));
      } else {
        showNotification('فشل في تحديث الملف الشخصي', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // تغيير كلمة المرور
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('/api/users/change-password/', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      // مسح نموذج كلمة المرور
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showNotification('تم تغيير كلمة المرور بنجاح');
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      
      if (error.response?.data) {
        setErrors(prev => ({
          ...prev,
          ...error.response.data
        }));
      } else {
        showNotification('فشل في تغيير كلمة المرور', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // عرض إشعار
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // إغلاق الإشعار
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
        الملف الشخصي
      </Typography>
      
      <Grid container spacing={4}>
        {/* بطاقة معلومات المستخدم */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'primary.main',
                  mb: 3,
                  fontSize: '3rem'
                }}
              >
                {user.username?.charAt(0) || <PersonIcon fontSize="large" />}
              </Avatar>
              
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user.username}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              
              <Divider sx={{ width: '100%', my: 2 }} />
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  المؤسسة
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.organization_detail?.name || 'غير محدد'}
                </Typography>
              </Box>
              
              <Divider sx={{ width: '100%', my: 2 }} />
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  الصلاحيات
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.is_admin ? 'مدير المؤسسة' : 'مستخدم عادي'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* نماذج تعديل الملف الشخصي */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* نموذج تعديل المعلومات الشخصية */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
                  المعلومات الشخصية
                </Typography>
                
                <Box component="form" onSubmit={handleSaveProfile}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="username"
                        name="username"
                        label="اسم المستخدم"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        error={!!errors.username}
                        helperText={errors.username}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="البريد الإلكتروني"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        error={!!errors.email}
                        helperText={errors.email}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="organization"
                        name="organization"
                        label="المؤسسة"
                        value={profileData.organization}
                        disabled
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ position: 'relative' }}
                      >
                        {loading ? (
                          <CircularProgress 
                            size={24} 
                            sx={{ 
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              marginTop: '-12px',
                              marginLeft: '-12px',
                            }} 
                          />
                        ) : 'حفظ التغييرات'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            {/* نموذج تغيير كلمة المرور */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
                  تغيير كلمة المرور
                </Typography>
                
                <Box component="form" onSubmit={handleChangePassword}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="currentPassword"
                        name="currentPassword"
                        label="كلمة المرور الحالية"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="newPassword"
                        name="newPassword"
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="confirmPassword"
                        name="confirmPassword"
                        label="تأكيد كلمة المرور الجديدة"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ position: 'relative' }}
                      >
                        {loading ? (
                          <CircularProgress 
                            size={24} 
                            sx={{ 
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              marginTop: '-12px',
                              marginLeft: '-12px',
                            }} 
                          />
                        ) : 'تغيير كلمة المرور'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* إشعارات */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
