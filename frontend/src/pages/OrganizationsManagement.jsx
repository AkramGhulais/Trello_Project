import { useState, useEffect, useContext } from 'react';
import { 
  Container, Box, Typography, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Alert, CircularProgress, Chip, Tooltip,
  Grid, Divider, Card, CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import axios from '../api/axios';

// صفحة إدارة المنظمات
const OrganizationsManagement = () => {
  const { user } = useContext(AuthContext);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!user || !user.is_admin) {
      setError('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      setLoading(false);
      return;
    }

    fetchOrganizations();
  }, [user]);

  // جلب قائمة المنظمات
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/organizations/');
      console.log('تم جلب المنظمات:', response.data);
      setOrganizations(response.data);
      setError('');
    } catch (error) {
      console.error('خطأ في جلب المنظمات:', error);
      setError('فشل في جلب قائمة المنظمات');
    } finally {
      setLoading(false);
    }
  };

  // تصفية المنظمات بناءً على البحث
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // توليد slug من اسم المنظمة
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/g, '') // يسمح بالحروف العربية والإنجليزية والأرقام والشرطات
      .replace(/-+/g, '-');
  };

  // فتح نافذة إضافة/تعديل منظمة
  const handleOpenDialog = (organization = null) => {
    if (organization) {
      // تعديل منظمة موجودة
      setSelectedOrganization(organization);
      setFormData({
        name: organization.name,
        slug: organization.slug
      });
    } else {
      // إضافة منظمة جديدة
      setSelectedOrganization(null);
      setFormData({
        name: '',
        slug: ''
      });
    }
    setOpenDialog(true);
  };

  // إغلاق نافذة إضافة/تعديل منظمة
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrganization(null);
  };

  // فتح نافذة حذف منظمة
  const handleOpenDeleteDialog = (organization) => {
    setSelectedOrganization(organization);
    setOpenDeleteDialog(true);
  };

  // إغلاق نافذة حذف منظمة
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedOrganization(null);
  };

  // تغيير قيم النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // إذا تم تغيير الاسم، قم بتحديث الـ slug تلقائيًا ما لم يكن المستخدم قد عدله بالفعل
    if (name === 'name' && (formData.slug === '' || formData.slug === generateSlug(formData.name))) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // إرسال نموذج إضافة/تعديل منظمة
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (selectedOrganization) {
        // تحديث منظمة موجودة
        const response = await axios.put(`/api/organizations/${selectedOrganization.id}/`, formData);
        console.log('تم تحديث المنظمة:', response.data);
        
        // تحديث قائمة المنظمات
        setOrganizations(prev => 
          prev.map(org => org.id === selectedOrganization.id ? response.data : org)
        );
        
        setSuccess('تم تحديث المنظمة بنجاح');
      } else {
        // إضافة منظمة جديدة
        const response = await axios.post('/api/organizations/', formData);
        console.log('تم إنشاء منظمة جديدة:', response.data);
        
        // إضافة المنظمة الجديدة إلى القائمة
        setOrganizations(prev => [...prev, response.data]);
        
        setSuccess('تم إنشاء المنظمة بنجاح');
      }
      
      // إغلاق النافذة وإعادة تعيين النموذج
      handleCloseDialog();
    } catch (error) {
      console.error('خطأ في حفظ المنظمة:', error);
      
      if (error.response && error.response.data) {
        // عرض رسائل الخطأ من الخادم
        const serverErrors = error.response.data;
        let errorMessage = 'حدث خطأ أثناء حفظ المنظمة:';
        
        for (const field in serverErrors) {
          errorMessage += `\n${field}: ${serverErrors[field].join(' ')}`;
        }
        
        setError(errorMessage);
      } else {
        setError('حدث خطأ أثناء حفظ المنظمة');
      }
    } finally {
      setLoading(false);
    }
  };

  // حذف منظمة
  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return;
    
    try {
      setLoading(true);
      
      await axios.delete(`/api/organizations/${selectedOrganization.id}/`);
      console.log('تم حذف المنظمة:', selectedOrganization.name);
      
      // إزالة المنظمة من القائمة
      setOrganizations(prev => 
        prev.filter(org => org.id !== selectedOrganization.id)
      );
      
      setSuccess('تم حذف المنظمة بنجاح');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('خطأ في حذف المنظمة:', error);
      
      if (error.response && error.response.status === 400) {
        setError('لا يمكن حذف هذه المنظمة لأنها تحتوي على مستخدمين أو مشاريع مرتبطة بها');
      } else {
        setError('حدث خطأ أثناء حذف المنظمة');
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

  // عرض عدد المستخدمين في المنظمة
  const getUserCount = (organizationId) => {
    return organizations.find(org => org.id === organizationId)?.user_count || 0;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            إدارة المنظمات
          </Typography>
          
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 1 }}
            >
              إضافة منظمة
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchOrganizations}
              sx={{ ml: 1 }}
            >
              تحديث
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* مربع البحث */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="البحث عن منظمة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
          sx={{ mb: 3 }}
        />
        
        {loading && organizations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error && organizations.length === 0 ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : organizations.length === 0 ? (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  لا توجد منظمات حتى الآن
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  إنشاء منظمة جديدة
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الاسم</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المعرف (Slug)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>تاريخ الإنشاء</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المستخدمون</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        لا توجد نتائج مطابقة للبحث
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {org.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={org.slug} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PeopleIcon />}
                          label={getUserCount(org.id)}
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="تعديل المنظمة">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenDialog(org)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف المنظمة">
                          <IconButton 
                            color="error" 
                            onClick={() => handleOpenDeleteDialog(org)}
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
        )}
      </Paper>
      
      {/* نافذة إضافة/تعديل منظمة */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedOrganization ? 'تعديل المنظمة' : 'إضافة منظمة جديدة'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="اسم المنظمة"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="المعرف (Slug)"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  helperText="المعرف المستخدم في عناوين URL (يجب أن يكون فريدًا)"
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
              {selectedOrganization ? 'حفظ التغييرات' : 'إضافة المنظمة'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>تأكيد حذف المنظمة</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            هل أنت متأكد من رغبتك في حذف المنظمة "{selectedOrganization?.name}"؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            هذا الإجراء لا يمكن التراجع عنه. قد يؤثر على المستخدمين والمشاريع المرتبطة بهذه المنظمة.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            إلغاء
          </Button>
          <Button 
            onClick={handleDeleteOrganization} 
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

export default OrganizationsManagement;
