import { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Avatar, Link, Alert, CircularProgress,
  Card, CardContent, Divider, Checkbox, FormControlLabel,
  IconButton, InputAdornment, Tooltip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, toggleBypassAuth } = useContext(AuthContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }
    
    try {
      // حفظ اسم المستخدم في التخزين المحلي إذا تم تحديد "تذكرني"
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }
      
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error('خطأ في تسجيل الدخول:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };
  
  // للتطوير فقط: تفعيل وضع تجاوز المصادقة
  const handleDevLogin = () => {
    toggleBypassAuth();
  };
  
  // تبديل عرض كلمة المرور
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // تحميل اسم المستخدم المحفوظ عند تحميل الصفحة
  useState(() => {
    const rememberedUsername = localStorage.getItem('remembered_username');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', overflow: 'visible', mb: 4, boxShadow: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar sx={{ 
                m: 1, 
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
                boxShadow: 3
              }}>
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                تسجيل الدخول
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                مرحباً بك مجدداً! يرجى تسجيل الدخول للوصول إلى حسابك
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="اسم المستخدم"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="كلمة المرور"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    color="primary" 
                  />
                }
                label="تذكرني"
                sx={{ mb: 2 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 2, 
                  mb: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  position: 'relative'
                }}
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
                ) : 'تسجيل الدخول'}
              </Button>
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">أو</Typography>
              </Divider>
              
              {/* زر للتطوير فقط */}
              <Tooltip title="للتطوير فقط: تجاوز تسجيل الدخول">
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<FlashOnIcon />}
                  onClick={handleDevLogin}
                  sx={{ mb: 3 }}
                >
                  دخول سريع (للتطوير فقط)
                </Button>
              </Tooltip>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body1">
                  ليس لديك حساب؟{' '}
                  <Link component={RouterLink} to="/register" variant="body1" sx={{ fontWeight: 'bold' }}>
                    إنشاء حساب جديد
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
