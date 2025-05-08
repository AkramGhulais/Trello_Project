import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Avatar, Link, Alert, CircularProgress,
  Card, CardContent, Grid, MenuItem, Select, FormControl,
  InputLabel, FormHelperText, IconButton, InputAdornment, Divider,
  Stepper, Step, StepLabel, StepContent, Checkbox, FormControlLabel
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import axios from '../api/axios';
import { signupUser } from '../api/auth';

const SignupNew = () => {
  const navigate = useNavigate();
  
  // حالة الخطوات
  const [activeStep, setActiveStep] = useState(0);
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    newOrganization: '',
    createNewOrg: false,
    agreeToTerms: false
  });
  
  // حالات أخرى
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  // جلب قائمة المؤسسات المتاحة
  const fetchOrganizations = async () => {
    if (loadingOrgs) return;
    
    setLoadingOrgs(true);
    try {
      const response = await axios.get('/api/organizations/');
      setOrganizations(response.data);
      console.log('تم جلب المؤسسات بنجاح:', response.data);
      
      // إذا كانت هناك مؤسسة واحدة على الأقل، اختر الأولى افتراضياً
      if (response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          organization: response.data[0].id
        }));
      }
    } catch (error) {
      console.error('خطأ في جلب المؤسسات:', error);
      // إنشاء مؤسسة افتراضية إذا لم يتمكن من جلب المؤسسات
      setFormData(prev => ({
        ...prev,
        createNewOrg: true
      }));
    } finally {
      setLoadingOrgs(false);
    }
  };
  
  // تحديث بيانات النموذج
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // تبديل بين اختيار مؤسسة موجودة أو إنشاء مؤسسة جديدة
  const toggleCreateNewOrg = () => {
    setFormData(prev => ({
      ...prev,
      createNewOrg: !prev.createNewOrg,
      organization: !prev.createNewOrg && organizations.length > 0 ? organizations[0].id : '',
      newOrganization: prev.createNewOrg ? '' : 'مؤسستي الجديدة'
    }));
  };
  
  // تبديل عرض كلمة المرور
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // تبديل عرض تأكيد كلمة المرور
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // التحقق من صحة البيانات للخطوة الحالية
  const validateCurrentStep = () => {
    const newErrors = {};
    let isValid = true;
    
    // التحقق من الخطوة الأولى (معلومات المستخدم)
    if (activeStep === 0) {
      if (!formData.username) {
        newErrors.username = 'اسم المستخدم مطلوب';
        isValid = false;
      } else if (formData.username.length < 3) {
        newErrors.username = 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل';
        isValid = false;
      }
      
      if (!formData.email) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صالح';
        isValid = false;
      }
    }
    
    // التحقق من الخطوة الثانية (كلمة المرور)
    else if (activeStep === 1) {
      if (!formData.password) {
        newErrors.password = 'كلمة المرور مطلوبة';
        isValid = false;
      } else if (formData.password.length < 8) {
        newErrors.password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل';
        isValid = false;
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        isValid = false;
      }
    }
    
    // التحقق من الخطوة الثالثة (المؤسسة)
    else if (activeStep === 2) {
      if (formData.createNewOrg) {
        if (!formData.newOrganization) {
          newErrors.newOrganization = 'اسم المؤسسة مطلوب';
          isValid = false;
        }
      } else {
        if (!formData.organization && organizations.length > 0) {
          newErrors.organization = 'الرجاء اختيار مؤسسة';
          isValid = false;
        }
      }
      
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'يجب الموافقة على الشروط والأحكام';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // الانتقال إلى الخطوة التالية
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (activeStep === 0 && !loadingOrgs && organizations.length === 0) {
        // جلب المؤسسات عند الانتقال إلى الخطوة الثانية إذا لم يتم جلبها من قبل
        fetchOrganizations();
      }
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // الرجوع إلى الخطوة السابقة
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // إرسال النموذج
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }
    
    try {
      setLoading(true);
      setGeneralError('');
      
      // تحضير البيانات للإرسال
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      
      // إذا كان المستخدم يريد إنشاء مؤسسة جديدة
      if (formData.createNewOrg && formData.newOrganization) {
        try {
          // إنشاء المؤسسة أولاً
          const orgResponse = await axios.post('/api/organizations/', {
            name: formData.newOrganization,
            slug: formData.newOrganization
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/g, '')
          });
          
          console.log('تم إنشاء المؤسسة بنجاح:', orgResponse.data);
          
          // إضافة معرف المؤسسة الجديدة إلى بيانات المستخدم
          userData.organization = orgResponse.data.id;
        } catch (orgError) {
          console.error('خطأ في إنشاء المؤسسة:', orgError);
          throw new Error('فشل في إنشاء المؤسسة. الرجاء المحاولة مرة أخرى.');
        }
      } else if (!formData.createNewOrg && formData.organization) {
        // استخدام مؤسسة موجودة
        userData.organization = formData.organization;
      }
      
      // إنشاء حساب المستخدم باستخدام الوظيفة الجديدة من ملف auth.js
      const response = await signupUser(userData);
      
      if (response && response.success) {
        console.log('تم تسجيل المستخدم بنجاح:', response);
        
        // عرض رسالة النجاح وإعادة توجيه المستخدم بعد فترة قصيرة
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // إذا كان هناك رسالة خطأ محددة من الخادم، استخدمها
        if (response.errors) {
          const serverErrors = response.errors;
          const newErrors = {};
          
          // تحويل أخطاء الخادم إلى تنسيق مناسب للعرض
          for (const field in serverErrors) {
            if (field === 'non_field_errors' || field === 'detail' || field === 'error') {
              setGeneralError(typeof serverErrors[field] === 'string' ? serverErrors[field] : JSON.stringify(serverErrors[field]));
            } else {
              newErrors[field] = Array.isArray(serverErrors[field])
                ? serverErrors[field][0]
                : serverErrors[field];
            }
          }
          
          setErrors(newErrors);
        } else {
          throw new Error(response.message || 'حدث خطأ أثناء إنشاء الحساب');
        }
      }
      
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      
      // معالجة أخطاء الاستجابة من الخادم
      if (error.response && error.response.data) {
        const serverErrors = error.response.data;
        const newErrors = {};
        
        // تحويل أخطاء الخادم إلى تنسيق مناسب للعرض
        for (const field in serverErrors) {
          if (field === 'non_field_errors' || field === 'detail') {
            setGeneralError(serverErrors[field]);
          } else {
            newErrors[field] = Array.isArray(serverErrors[field])
              ? serverErrors[field][0]
              : serverErrors[field];
          }
        }
        
        setErrors(newErrors);
      } else {
        // رسالة خطأ عامة
        setGeneralError(error.message || 'حدث خطأ أثناء إنشاء الحساب. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // خطوات التسجيل
  const steps = [
    {
      label: 'معلومات المستخدم',
      icon: <PersonIcon />,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="username"
              label="اسم المستخدم"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              label="البريد الإلكتروني"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'كلمة المرور',
      icon: <VpnKeyIcon />,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'المؤسسة',
      icon: <BusinessIcon />,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                color={formData.createNewOrg ? 'primary' : 'secondary'}
                onClick={toggleCreateNewOrg}
                sx={{ mr: 2 }}
              >
                {formData.createNewOrg ? 'اختيار مؤسسة موجودة' : 'إنشاء مؤسسة جديدة'}
              </Button>
            </Box>
          </Grid>
          
          {formData.createNewOrg ? (
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="newOrganization"
                label="اسم المؤسسة الجديدة"
                id="newOrganization"
                value={formData.newOrganization}
                onChange={handleChange}
                error={!!errors.newOrganization}
                helperText={errors.newOrganization}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.organization}>
                <InputLabel id="organization-label">المؤسسة</InputLabel>
                <Select
                  labelId="organization-label"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  label="المؤسسة"
                  onChange={handleChange}
                  disabled={loadingOrgs}
                >
                  {loadingOrgs ? (
                    <MenuItem value="">
                      <CircularProgress size={20} /> جاري التحميل...
                    </MenuItem>
                  ) : organizations.length === 0 ? (
                    <MenuItem value="">
                      <em>لا توجد مؤسسات متاحة</em>
                    </MenuItem>
                  ) : (
                    organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.organization && (
                  <FormHelperText>{errors.organization}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  color="primary"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
              }
              label="أوافق على الشروط والأحكام"
            />
            {errors.agreeToTerms && (
              <FormHelperText error>{errors.agreeToTerms}</FormHelperText>
            )}
          </Grid>
        </Grid>
      )
    }
  ];
  
  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Avatar sx={{ m: 'auto', bgcolor: 'primary.main', width: 56, height: 56 }}>
                <PersonAddIcon fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" sx={{ mt: 2 }}>
                إنشاء حساب جديد
              </Typography>
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  تم إنشاء الحساب بنجاح! جاري تحويلك إلى لوحة التحكم...
                </Alert>
              )}
              {generalError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {generalError}
                </Alert>
              )}
            </Box>
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconProps={{
                      icon: step.icon
                    }}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {step.content}
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        السابق
                      </Button>
                      <Box>
                        {index === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{ mt: 1, mr: 1 }}
                            disabled={loading}
                          >
                            {loading ? (
                              <CircularProgress size={24} />
                            ) : (
                              'إنشاء الحساب'
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            التالي
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                لديك حساب بالفعل؟{' '}
                <Link component={RouterLink} to="/login" variant="body1" sx={{ fontWeight: 'bold' }}>
                  تسجيل الدخول
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SignupNew;
