import { useState, useEffect, useContext } from 'react';
import { 
  Container, Box, Typography, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, CircularProgress, Chip, Tooltip,
  Grid, Divider, Switch, FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import axios from '../api/axios';

// صفحة إدارة المستخدمين (للمشرف فقط)
const UsersManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    organization: '',
    is_admin: false
  });

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!user || !user.is_admin) {
      setError('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      setLoading(false);
      return;
    }

    fetchUsers();
    fetchOrganizations();
  }, [user]);

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/');
      console.log('تم جلب المستخدمين:', response.data);
      setUsers(response.data);
      setError('');
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setError('فشل في جلب قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  // جلب قائمة المؤسسات
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('/api/organizations/');
      console.log('تم جلب المؤسسات:', response.data);
      setOrganizations(response.data);
    } catch (error) {
      console.error('خطأ في جلب المؤسسات:', error);
    }
  };

  // تصفية المستخدمين بناءً على البحث
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // فتح نافذة إضافة/تعديل مستخدم
  const handleOpenDialog = (user = null) => {
    if (user) {
      // تعديل مستخدم موجود
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // لا نعرض كلمة المرور الحالية
        organization: user.organization,
        is_admin: user.is_admin
      });
    } else {
      // إضافة مستخدم جديد
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        organization: '',
        is_admin: false
      });
    }
    setOpenDialog(true);
  };

  // إغلاق نافذة إضافة/تعديل مستخدم
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  // فتح نافذة حذف مستخدم
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  // إغلاق نافذة حذف مستخدم
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };

  // تغيير قيم النموذج
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_admin' ? checked : value
    }));
  };

  // إرسال نموذج إضافة/تعديل مستخدم
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (selectedUser) {
        // تعديل مستخدم موجود
        const userData = { ...formData };
        
        // لا نرسل كلمة المرور إذا كانت فارغة
        if (!userData.password) {
          delete userData.password;
        }
        
        // استخدام API الجديدة للتعديل
        const response = await axios.put(`/api/users/${selectedUser.id}/`, userData);
        console.log('تم تعديل المستخدم:', response.data);
        
        // تحديث قائمة المستخدمين
        setUsers(users.map(u => u.id === selectedUser.id ? response.data : u));
        setSuccess('تم تعديل المستخدم بنجاح');
      } else {
        // إضافة مستخدم جديد
        // التأكد من وجود كلمة مرور قوية
        if (!formData.password || formData.password.length < 8) {
          setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
          setLoading(false);
          return;
        }
        
        if (!formData.password.match(/[A-Z]/) || !formData.password.match(/[0-9]/)) {
          setError('كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل');
          setLoading(false);
          return;
        }
        
        // استخدام API الجديدة للإضافة
        const response = await axios.post('/api/users/', formData);
        console.log('تم إضافة المستخدم:', response.data);
        
        // تحديث قائمة المستخدمين
        setUsers([...users, response.data]);
        setSuccess(`تم إضافة المستخدم ${formData.username} بنجاح ويمكنه الآن تسجيل الدخول`);
      }
      
      // إغلاق النافذة
      handleCloseDialog();
    } catch (error) {
      console.error('خطأ في إضافة/تعديل المستخدم:', error);
      
      // عرض رسائل الخطأ بشكل أفضل
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'object') {
          const errorMessages = [];
          Object.entries(error.response.data).forEach(([key, value]) => {
            const message = Array.isArray(value) ? value[0] : value;
            errorMessages.push(`${key}: ${message}`);
          });
          setError(errorMessages.join('، '));
        } else {
          setError(error.response.data);
        }
      } else {
        setError('فشل في إضافة/تعديل المستخدم');
      }
    } finally {
      setLoading(false);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/users/${selectedUser.id}/`);
      
      // تحديث قائمة المستخدمين
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setSuccess('تم حذف المستخدم بنجاح');
      
      // إغلاق النافذة
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      setError(error.response?.data?.message || 'فشل في حذف المستخدم');
    } finally {
      setLoading(false);
    }
  };

  // تغيير حالة المشرف للمستخدم
  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      setLoading(true);
      // استخدام API الجديدة لتغيير حالة المشرف
      const response = await axios.post(`/api/users/${userId}/toggle_admin/`);
      
      // تحديث قائمة المستخدمين
      setUsers(users.map(u => u.id === userId ? response.data : u));
      setSuccess(`تم ${!isAdmin ? 'منح' : 'إلغاء'} صلاحيات المشرف بنجاح`);
    } catch (error) {
      console.error('خطأ في تغيير حالة المشرف:', error);
      
      // عرض رسائل الخطأ بشكل أفضل
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'object') {
          const errorMessages = [];
          Object.entries(error.response.data).forEach(([key, value]) => {
            const message = Array.isArray(value) ? value[0] : value;
            errorMessages.push(`${key}: ${message}`);
          });
          setError(errorMessages.join('، '));
        } else {
          setError(error.response.data);
        }
      } else {
        setError('فشل في تغيير حالة المشرف');
      }
    } finally {
      setLoading(false);
    }
  };

  // إغلاق رسائل النجاح والخطأ
  const handleCloseAlert = () => {
    setSuccess('');
    setError('');
  };

  // التحقق من صلاحيات المستخدم
  if (!user || !user.is_admin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            غير مصرح بالوصول
          </Typography>
          <Typography variant="body1">
            ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع مشرف النظام.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* عنوان الصفحة */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AdminIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          إدارة المستخدمين
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          إضافة مستخدم جديد
        </Button>
      </Box>

      {/* بطاقة الإحصائيات */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>إجمالي المستخدمين</Typography>
              <Typography variant="h3">{users.length}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>المشرفين</Typography>
              <Typography variant="h3">{users.filter(u => u.is_admin).length}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>المؤسسات</Typography>
              <Typography variant="h3">{organizations.length}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* شريط البحث والتصفية */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="بحث عن مستخدم"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              sx={{ mr: 1 }}
            >
              تحديث
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* جدول المستخدمين */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>اسم المستخدم</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>البريد الإلكتروني</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>المؤسسة</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>الصلاحية</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    جاري تحميل بيانات المستخدمين...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    لا يوجد مستخدمين متطابقين مع معايير البحث
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {user.is_admin ? 
                        <AdminIcon color="primary" sx={{ mr: 1 }} /> : 
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }
                      {user.username}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.organization_detail ? (
                      <Chip 
                        label={user.organization_detail.name} 
                        size="small" 
                        color="info"
                      />
                    ) : (
                      <Chip 
                        label="لا يوجد" 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.is_admin}
                          onChange={() => handleToggleAdmin(user.id, user.is_admin)}
                          color="primary"
                        />
                      }
                      label={user.is_admin ? "مشرف" : "مستخدم عادي"}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="تعديل المستخدم">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف المستخدم">
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* نافذة إضافة/تعديل مستخدم */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="اسم المستخدم"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="البريد الإلكتروني"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={selectedUser ? "كلمة المرور (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور"}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!selectedUser}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>المؤسسة</InputLabel>
                  <Select
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    label="المؤسسة"
                  >
                    <MenuItem value="">
                      <em>بدون مؤسسة</em>
                    </MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_admin}
                      onChange={handleChange}
                      name="is_admin"
                      color="primary"
                    />
                  }
                  label="منح صلاحيات المشرف"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {selectedUser ? 'حفظ التغييرات' : 'إضافة المستخدم'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            هل أنت متأكد من رغبتك في حذف المستخدم "{selectedUser?.username}"؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            هذا الإجراء لا يمكن التراجع عنه.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            إلغاء
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* رسائل النجاح والخطأ */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UsersManagement;
