import { useState, useEffect, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Grid, Button, 
  Card, CardContent, CardActions, CardMedia,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { WebSocketContext } from '../contexts/WebSocketContext';
// استخدام نسخة axios المخصصة
import axios from '../api/axios';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import FolderIcon from '@mui/icons-material/Folder';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// استيراد مكون قسم المؤسسات
import OrganizationsSection from '../components/dashboard/OrganizationsSection';


// مكون بطاقة المشروع
const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();
  
  // حساب نسبة اكتمال المشروع (عدد المهام المكتملة / إجمالي المهام)
  const completionPercentage = project.completion_percentage || 0;
  
  // تحديد لون شريط التقدم بناءً على نسبة الاكتمال
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FolderIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            {project.title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden' }}>
          {project.description || 'لا يوجد وصف للمشروع'}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              نسبة الإنجاز
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            color={getProgressColor(completionPercentage)}
            sx={{ height: 8, borderRadius: 5 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Chip 
            label={`${project.tasks_count || 0} مهمة`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            آخر تحديث: {new Date(project.updated_at).toLocaleDateString('ar-SA')}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          عرض المشروع
        </Button>
      </CardActions>
    </Card>
  );
};

// مكون إنشاء/تعديل المشروع
const ProjectFormDialog = ({ open, project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // تحميل بيانات المشروع عند التعديل
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || ''
      });
    } else {
      setFormData({
        title: '',
        description: ''
      });
    }
  }, [project]);
  
  // تحديث بيانات النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // حفظ المشروع
  const handleSave = async () => {
    if (!formData.title) {
      setError('عنوان المشروع مطلوب');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ المشروع:', error);
      setError('حدث خطأ أثناء حفظ المشروع');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {project ? 'تعديل المشروع' : 'إنشاء مشروع جديد'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="title"
          name="title"
          label="عنوان المشروع"
          type="text"
          fullWidth
          required
          value={formData.title}
          onChange={handleChange}
          sx={{ mb: 3 }}
        />
        
        <TextField
          margin="dense"
          id="description"
          name="description"
          label="وصف المشروع"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          إلغاء
        </Button>
        <Button 
          onClick={handleSave} 
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
          ) : project ? 'تحديث' : 'إنشاء'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// مكون تأكيد الحذف
const DeleteConfirmDialog = ({ open, project, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  
  const handleConfirm = async () => {
    setLoading(true);
    
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        تأكيد الحذف
      </DialogTitle>
      <DialogContent>
        <Typography>
          هل أنت متأكد من حذف المشروع "{project?.title}"؟
        </Typography>
        <Typography color="error" sx={{ mt: 2 }}>
          سيتم حذف جميع المهام المرتبطة بهذا المشروع.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          إلغاء
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="error"
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
          ) : 'حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// الصفحة الرئيسية للوحة التحكم
function Dashboard() {
  const { user, bypassAuth } = useContext(AuthContext);
  const { socket } = useContext(WebSocketContext);
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  
  // التحقق من أن المستخدم هو مالك النظام
  const isSystemOwner = user?.is_system_owner || false;
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // جلب المشاريع عند تحميل الصفحة
  useEffect(() => {
    fetchProjects();
    
    // الاستماع لأحداث المشاريع من WebSocket
    if (socket && socket.on) {
      // تسجيل مستمعي الأحداث
      socket.on('project_created', handleProjectCreated);
      socket.on('project_updated', handleProjectUpdated);
      socket.on('project_deleted', handleProjectDeleted);
      
      // تنظيف عند إزالة المكون
      return () => {
        if (socket && socket.off) {
          socket.off('project_created');
          socket.off('project_updated');
          socket.off('project_deleted');
        }
      };
    }
  }, [socket]);

  // جلب المشاريع من الخادم
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // إذا كان وضع التجاوز مفعل، استخدم بيانات وهمية
      if (bypassAuth) {
        const mockProjects = [
          {
            id: 1,
            name: 'مشروع تجريبي 1',
            description: 'وصف للمشروع التجريبي الأول',
            color: '#4caf50',
            created_at: new Date().toISOString(),
            owner: { id: 1, username: 'مستخدم افتراضي' },
            organization: { id: 1, name: 'شركة سوفا' }
          },
          {
            id: 2,
            name: 'مشروع تجريبي 2',
            description: 'وصف للمشروع التجريبي الثاني',
            color: '#2196f3',
            created_at: new Date().toISOString(),
            owner: { id: 1, username: 'مستخدم افتراضي' },
            organization: { id: 1, name: 'شركة سوفا' }
          }
        ];
        setProjects(mockProjects);
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/projects/');
      setProjects(response.data);
      setError(null);
    } catch (error) {
      console.error('خطأ في جلب المشاريع:', error);
      setError('حدث خطأ أثناء جلب المشاريع');
    } finally {
      setLoading(false);
    }
  };

  // معالجة إنشاء مشروع جديد من WebSocket
  const handleProjectCreated = (project) => {
    setProjects(prevProjects => [...prevProjects, project]);
  };
  
  // معالجة تحديث مشروع من WebSocket
  const handleProjectUpdated = (updatedProject) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };
  
  // معالجة حذف مشروع من WebSocket
  const handleProjectDeleted = (projectId) => {
    setProjects(prevProjects => 
      prevProjects.filter(p => p.id !== projectId)
    );
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
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // فتح نافذة إنشاء مشروع جديد
  const handleCreateProject = () => {
    setCurrentProject(null);
    setProjectFormOpen(true);
  };
  
  // فتح نافذة تعديل مشروع
  const handleEditProject = (project) => {
    setCurrentProject(project);
    setProjectFormOpen(true);
  };
  
  // فتح نافذة تأكيد حذف مشروع
  const handleDeleteClick = (project) => {
    setCurrentProject(project);
    setDeleteDialogOpen(true);
  };
  
  // حفظ المشروع (إنشاء أو تعديل)
  const handleSaveProject = async (formData) => {
    try {
      // إذا كان وضع التجاوز مفعل، استخدم بيانات وهمية
      if (bypassAuth) {
        const mockProject = {
          id: currentProject ? currentProject.id : Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
          owner: { id: 1, username: 'مستخدم افتراضي' },
          organization: { id: 1, name: 'شركة سوفا' }
        };
        
        if (currentProject) {
          // تعديل مشروع موجود
          setProjects(projects.map(p => 
            p.id === currentProject.id ? mockProject : p
          ));
          showNotification('تم تحديث المشروع بنجاح');
        } else {
          // إنشاء مشروع جديد
          setProjects([...projects, mockProject]);
          showNotification('تم إنشاء المشروع بنجاح');
        }
        setProjectFormOpen(false);
        return;
      }
      
      if (currentProject) {
        // تعديل مشروع موجود
        console.log('تحديث مشروع موجود:', formData);
        const response = await axios.patch(`/api/projects/${currentProject.id}/`, formData);
        console.log('استجابة تحديث المشروع:', response.data);
        
        // تحديث المشروع في الحالة
        setProjects(projects.map(p => 
          p.id === currentProject.id ? response.data : p
        ));
        
        showNotification('تم تحديث المشروع بنجاح');
        setProjectFormOpen(false);
      } else {
        // إنشاء مشروع جديد
        console.log('إنشاء مشروع جديد بالبيانات:', formData);
        
        // التأكد من أن البيانات تحتوي على الحقول المطلوبة
        if (!formData.title) {
          showNotification('عنوان المشروع مطلوب', 'error');
          return;
        }
        
        // إعداد البيانات للإرسال
        const projectData = {
          title: formData.title,
          description: formData.description || '',
        };
        
        console.log('البيانات النهائية للإرسال:', projectData);
        
        try {
          // إرسال الطلب بالبيانات المطلوبة
          const response = await axios.post('/api/projects/', projectData);
          
          console.log('استجابة إنشاء المشروع:', response.data);
          
          // إضافة المشروع الجديد إلى الحالة
          setProjects([...projects, response.data]);
          
          showNotification('تم إنشاء المشروع بنجاح');
          setProjectFormOpen(false);
        } catch (innerError) {
          console.error('خطأ في إنشاء المشروع:', innerError);
          
          // عرض تفاصيل الخطأ
          if (innerError.response) {
            console.error('استجابة الخطأ:', innerError.response.data);
            console.error('حالة الخطأ:', innerError.response.status);
            console.error('رأس الخطأ:', innerError.response.headers);
            
            // عرض رسالة خطأ مفصلة
            let errorMessage = 'حدث خطأ أثناء إنشاء المشروع';
            if (innerError.response.data) {
              if (typeof innerError.response.data === 'object') {
                errorMessage += ': ' + Object.entries(innerError.response.data)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ');
              } else if (typeof innerError.response.data === 'string') {
                errorMessage += ': ' + innerError.response.data;
              }
            }
            
            showNotification(errorMessage, 'error');
          } else if (innerError.request) {
            console.error('الطلب:', innerError.request);
            showNotification('لم يتم استلام استجابة من الخادم. تأكد من تشغيل الخادم الخلفي.', 'error');
          } else {
            console.error('رسالة الخطأ:', innerError.message);
            showNotification(`خطأ: ${innerError.message}`, 'error');
          }
        }
      }
    } catch (error) {
      console.error('خطأ في حفظ المشروع:', error);
      
      // عرض تفاصيل الخطأ
      let errorMessage = 'حدث خطأ أثناء حفظ المشروع';
      
      if (error.response) {
        console.error('استجابة الخطأ:', error.response.data);
        console.error('حالة الخطأ:', error.response.status);
        
        if (error.response.status === 401) {
          errorMessage = 'غير مصرح لك بهذه العملية. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error.response.data) {
          if (typeof error.response.data === 'object') {
            const errors = Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            errorMessage += `: ${errors}`;
          } else if (typeof error.response.data === 'string') {
            errorMessage += `: ${error.response.data}`;
          }
        }
      } else if (error.request) {
        errorMessage = 'لم يتم استلام استجابة من الخادم. تأكد من تشغيل الخادم الخلفي.';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  // حذف المشروع
  const handleDeleteProject = async () => {
    if (!currentProject) return;
    
    try {
      // إذا كان وضع التجاوز مفعل، استخدم بيانات وهمية
      if (bypassAuth) {
        setProjects(projects.filter(p => p.id !== currentProject.id));
        showNotification('تم حذف المشروع بنجاح');
        setDeleteDialogOpen(false);
        return;
      }
      
      await axios.delete(`/api/projects/${currentProject.id}/`);
      
      // حذف المشروع من الحالة
      setProjects(projects.filter(p => p.id !== currentProject.id));
      
      showNotification('تم حذف المشروع بنجاح');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('خطأ في حذف المشروع:', error);
      showNotification('حدث خطأ أثناء حذف المشروع', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* رأس الصفحة */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          لوحة التحكم
          {isSystemOwner && <Chip 
            label="مالك النظام" 
            color="error" 
            size="small" 
            sx={{ ml: 1, fontWeight: 'bold' }} 
          />}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          مشروع جديد
        </Button>
      </Box>
      
      {/* قسم المؤسسات لمالك النظام */}
      {isSystemOwner && (
        <>
          <OrganizationsSection token={localStorage.getItem('access_token')} />
          <Divider sx={{ my: 4 }} />
        </>
      )}
      
      {/* قسم المشاريع */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          المشاريع
        </Typography>
        
        <Fab
          color="primary"
          aria-label="إضافة"
          onClick={handleCreateProject}
          sx={{ 
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.05)'
            },
            transition: 'transform 0.2s'
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={10} sx={{ mb: 1 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="text" width={100} />
                  </Box>
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={120} height={30} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {projects.length > 0 ? (
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                  <ProjectCard 
                    project={project} 
                    onEdit={handleEditProject}
                    onDelete={handleDeleteClick}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center'
              }}
            >
              <Box
                component="img"
                src="/empty-projects.svg"
                alt="لا توجد مشاريع"
                sx={{ 
                  width: 200, 
                  height: 200, 
                  opacity: 0.7,
                  mb: 3
                }}
              />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                لا توجد مشاريع بعد
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                أنشئ مشروعك الأول لبدء إدارة المهام وتتبع التقدم
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreateProject}
              >
                إنشاء مشروع جديد
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* نافذة إنشاء/تعديل المشروع */}
      <ProjectFormDialog
        open={projectFormOpen}
        project={currentProject}
        onClose={() => setProjectFormOpen(false)}
        onSave={handleSaveProject}
      />
      
      {/* نافذة تأكيد الحذف */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        project={currentProject}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
      />
      
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

export default Dashboard;
