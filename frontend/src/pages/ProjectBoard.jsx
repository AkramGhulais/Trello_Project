import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Grid, Paper, Button, 
  Card, CardContent, CardActions, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Chip, Avatar, Divider, Tooltip,
  Alert, Snackbar, FormHelperText, ListItemAvatar,
  ListItemText, ListItemButton, List, InputAdornment,
  Autocomplete, Checkbox, ListItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AuthContext } from '../contexts/AuthContext';
import { WebSocketContext } from '../contexts/WebSocketContext';
import UserSelector from '../components/UserSelector';
import TaskDetailDialog from '../components/TaskDetailDialog';
import axios from '../api/axios';

// تعريف أعمدة الحالة
const statusColumns = [
  { id: 'todo', title: 'المهام الجديدة', color: '#e0e0e0' },
  { id: 'in_progress', title: 'قيد التنفيذ', color: '#bbdefb' },
  { id: 'done', title: 'مكتملة', color: '#c8e6c9' }
];

// تعريف أولويات المهام
const priorityOptions = [
  { value: 'low', label: 'منخفضة', color: '#8bc34a' },
  { value: 'medium', label: 'متوسطة', color: '#ffc107' },
  { value: 'high', label: 'عالية', color: '#f44336' }
];

// الحصول على لون الأولوية
const getPriorityColor = (priority) => {
  const option = priorityOptions.find(opt => opt.value === priority);
  return option ? option.color : '#8bc34a';
};

// مكون بطاقة المهمة
const TaskCard = ({ task, onEdit, onDelete, onViewDetails }) => {
  // تحديد لون الأولوية
  const priorityColor = getPriorityColor(task.priority || 'low');
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        borderLeft: `4px solid ${priorityColor}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 3
        }
      }}
      onClick={() => onViewDetails(task)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word' }}>
            {task.title}
          </Typography>
          <Chip 
            size="small" 
            label={task.priority ? priorityOptions.find(opt => opt.value === task.priority)?.label : 'منخفضة'} 
            sx={{ backgroundColor: priorityColor, color: 'white', fontWeight: 'bold' }}
          />
        </Box>
        
        {task.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              maxHeight: '80px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {task.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {task.assignee ? (
            <Tooltip title={`${task.assignee.first_name || ''} ${task.assignee.last_name || ''}`}>
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: task.assignee.color || '#1976d2' }}>
                    {(task.assignee.first_name || task.assignee.username || 'U').charAt(0)}
                  </Avatar>
                }
                label={task.assignee.first_name ? `${task.assignee.first_name} ${task.assignee.last_name || ''}` : task.assignee.username || 'مستخدم'}
                variant="outlined"
                size="small"
              />
            </Tooltip>
          ) : (
            <Chip
              icon={<PersonIcon fontSize="small" />}
              label="غير معين"
              variant="outlined"
              size="small"
              sx={{ color: 'text.secondary' }}
            />
          )}
          
          {task.due_date && (
            <Tooltip title="تاريخ الاستحقاق">
              <Chip
                label={new Date(task.due_date).toLocaleDateString('ar-EG')}
                size="small"
                color={new Date(task.due_date) < new Date() ? "error" : "default"}
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          color="primary"
          sx={{ '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          color="error"
          sx={{ '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
};

// مكون عمود المهام
const TaskColumn = ({ status, tasks, onAddTask, onEditTask, onDeleteTask, onViewTaskDetails }) => {
  const column = statusColumns.find(col => col.id === status) || { id: status, title: status, color: '#e0e0e0' };
  
  // تحديد لون العمود والزر
  const columnColor = column.id === 'todo' ? '#f5f5f5' : column.id === 'in_progress' ? '#e3f2fd' : '#e8f5e9';
  const buttonColor = column.id === 'todo' ? '#f44336' : column.id === 'in_progress' ? '#ff9800' : '#4caf50';
  
  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2, 
        bgcolor: columnColor, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: buttonColor,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{column.title}</Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          color={column.id === 'todo' ? 'error' : column.id === 'in_progress' ? 'warning' : 'success'}
          sx={{ fontWeight: 'bold' }}
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ flexGrow: 1, mb: 2, overflow: 'hidden' }}>
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ 
                height: '100%',
                minHeight: '100px', 
                maxHeight: 'calc(100vh - 280px)',
                overflowY: 'auto',
                transition: 'background-color 0.2s ease',
                backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                borderRadius: '4px',
                p: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <Box 
                  sx={{ 
                    height: '100px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 0.7,
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <AssignmentIcon color="disabled" fontSize="large" />
                  <Typography color="text.secondary" align="center" variant="body2">
                    {column.id === 'todo' ? 'لا توجد مهام جديدة' : 
                     column.id === 'in_progress' ? 'لا توجد مهام قيد التنفيذ' : 
                     'لا توجد مهام مكتملة'}
                  </Typography>
                </Box>
              )}
              
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1
                      }}
                    >
                      <TaskCard 
                        task={task} 
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onViewDetails={onViewTaskDetails}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
      
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => onAddTask(status)}
        sx={{ 
          bgcolor: buttonColor,
          '&:hover': {
            bgcolor: column.id === 'todo' ? '#d32f2f' : column.id === 'in_progress' ? '#e65100' : '#2e7d32',
          }
        }}
        fullWidth
      >
        إضافة مهمة
      </Button>
    </Paper>
  );
};

// مكون نافذة إضافة/تعديل المهمة
const TaskFormDialog = ({ open, onClose, task, projectId, onSave, users }) => {
  console.log('المستخدمون المتاحون:', users);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    assignee: '',
    priority: 'medium',
    due_date: null
  });
  
  // حالة تحميل حفظ النموذج
  const [saving, setSaving] = useState(false);
  
  // رسائل الخطأ للحقول
  const [errors, setErrors] = useState({});
  
  // إعادة تعيين النموذج عند فتح النافذة
  useEffect(() => {
    if (open) {
      if (task) {
        // تعديل مهمة موجودة
        console.log('تحميل بيانات المهمة للتعديل:', task);
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          assignee: task.assignee?.id || '',
          priority: task.priority || 'medium',
          due_date: task.due_date || null
        });
      } else {
        // إضافة مهمة جديدة
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          assignee: '',
          priority: 'medium',
          due_date: null
        });
      }
      // إعادة تعيين رسائل الخطأ
      setErrors({});
    }
  }, [task, open]);
  
  // تحديث بيانات النموذج
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`تغيير الحقل: ${name}, القيمة الجديدة:`, value);
    
    // إزالة رسالة الخطأ عند تغيير الحقل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // معالجة تغيير المستخدم المسؤول
  const handleUserChange = (e) => {
    console.log('تم اختيار المستخدم المسؤول:', e.target.value);
    
    // إزالة رسالة الخطأ عند تغيير المستخدم
    if (errors.assignee) {
      setErrors(prev => ({ ...prev, assignee: null }));
    }
    
    setFormData(prev => ({
      ...prev,
      assignee: e.target.value
    }));
  };
  
  // معالجة تغيير تاريخ الاستحقاق
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      due_date: date
    }));
  };
  
  // التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors = {};
    
    // التحقق من عنوان المهمة
    if (!formData.title.trim()) {
      newErrors.title = 'يرجى إدخال عنوان للمهمة';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'يجب أن يكون عنوان المهمة 3 أحرف على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // حفظ المهمة
  const handleSave = async () => {
    // التحقق من صحة النموذج
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // تحضير بيانات المهمة للإرسال
      const taskData = {
        ...formData,
        project: projectId
      };
      
      // التأكد من وجود البيانات الإلزامية
      if (!taskData.project) {
        throw new Error('لم يتم تحديد المشروع');
      }
      
      console.log('بيانات المهمة للحفظ:', taskData);
      
      // استدعاء دالة الحفظ المُمررة من المكون الأب
      await onSave(taskData, task?.id);
      
      // إغلاق النافذة بعد الحفظ
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ المهمة:', error);
      
      // إظهار رسالة الخطأ في النموذج
      if (error.response?.data) {
        const serverErrors = error.response.data;
        const formErrors = {};
        
        // معالجة أخطاء الخادم
        if (typeof serverErrors === 'object') {
          Object.keys(serverErrors).forEach(key => {
            formErrors[key] = Array.isArray(serverErrors[key]) 
              ? serverErrors[key][0] 
              : serverErrors[key];
          });
        } else if (typeof serverErrors === 'string') {
          formErrors.general = serverErrors;
        }
        
        setErrors(formErrors);
      } else {
        // رسالة خطأ عامة
        setErrors({ general: 'حدث خطأ أثناء حفظ المهمة. يرجى المحاولة مرة أخرى.' });
      }
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={!saving ? onClose : undefined} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: '8px' }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        {task ? <EditIcon color="primary" fontSize="small" /> : <AddIcon color="primary" fontSize="small" />}
        {task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {/* رسالة خطأ عامة */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}
        
        {/* عنوان المهمة */}
        <TextField
          autoFocus
          margin="dense"
          name="title"
          label="عنوان المهمة"
          type="text"
          fullWidth
          value={formData.title}
          onChange={handleInputChange}
          variant="outlined"
          required
          error={!!errors.title}
          helperText={errors.title}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AssignmentIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        {/* وصف المهمة */}
        <TextField
          margin="dense"
          name="description"
          label="وصف المهمة"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={handleInputChange}
          variant="outlined"
          error={!!errors.description}
          helperText={errors.description}
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={2}>
          {/* حالة المهمة */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel id="status-label">حالة المهمة</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={formData.status}
                label="حالة المهمة"
                onChange={handleInputChange}
              >
                <MenuItem value="todo">قيد الانتظار</MenuItem>
                <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
                <MenuItem value="done">مكتملة</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* أولوية المهمة */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.priority}>
              <InputLabel id="priority-label">أولوية المهمة</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                name="priority"
                value={formData.priority}
                label="أولوية المهمة"
                onChange={handleInputChange}
              >
                <MenuItem value="low">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#8bc34a', mr: 1 }} />
                    <span>منخفضة</span>
                  </Box>
                </MenuItem>
                <MenuItem value="medium">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#ffc107', mr: 1 }} />
                    <span>متوسطة</span>
                  </Box>
                </MenuItem>
                <MenuItem value="high">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#f44336', mr: 1 }} />
                    <span>عالية</span>
                  </Box>
                </MenuItem>
              </Select>
              {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          {/* اختيار المستخدم المسؤول */}
          <FormControl fullWidth error={!!errors.assignee} sx={{ mb: 2 }}>
            <InputLabel id="assignee-label">المسؤول عن المهمة</InputLabel>
            <Select
              labelId="assignee-label"
              id="assignee"
              name="assignee"
              value={formData.assignee}
              label="المسؤول عن المهمة"
              onChange={handleUserChange}
              startAdornment={<PersonIcon sx={{ ml: 1 }} />}
            >
              <MenuItem value="">لا أحد</MenuItem>
              {Array.isArray(users) && users.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: user.color || '#1976d2' }}>
                      {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.assignee || 'اختر المستخدم المسؤول عن تنفيذ هذه المهمة'}</FormHelperText>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={saving}
        >
          إلغاء
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// مكون تأكيد الحذف
const DeleteConfirmDialog = ({ open, task, onClose, onConfirm }) => {
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
          هل أنت متأكد من حذف المهمة "{task?.title}"؟
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

// الصفحة الرئيسية للوحة المهام
const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    done: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const { user } = useContext(AuthContext);
  const { subscribeToProject, unsubscribeFromProject, connected } = useContext(WebSocketContext);
  
  // جلب بيانات المشروع والمهام
  useEffect(() => {
    fetchProjectData();
    
    // الاشتراك في تحديثات المشروع عبر WebSocket
    if (connected) {
      subscribeToProject(projectId);
    }
    
    // إلغاء الاشتراك عند مغادرة الصفحة
    return () => {
      if (connected) {
        unsubscribeFromProject(projectId);
      }
    };
  }, [projectId, connected]);
  
  // جلب بيانات المشروع والمهام من الخادم
  const fetchProjectData = async () => {
    setLoading(true);
    
    try {
      console.log(`محاولة جلب بيانات المشروع رقم: ${projectId}`);
      console.log(`رابط API: ${axios.defaults.baseURL}/api/projects/${projectId}/`);
      console.log('رمز المصادقة موجود:', !!localStorage.getItem('access_token'));
      
      // جلب بيانات المشروع
      const projectResponse = await axios.get(`/api/projects/${projectId}/`)
        .catch(error => {
          console.error('تفاصيل خطأ جلب المشروع:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          throw error;
        });
      
      console.log('تم جلب بيانات المشروع بنجاح:', projectResponse.data);
      setProject(projectResponse.data);
      
      // جلب مهام المشروع
      console.log(`محاولة جلب مهام المشروع: /api/projects/${projectId}/tasks/`);
      const tasksResponse = await axios.get(`/api/projects/${projectId}/tasks/`)
        .catch(error => {
          console.error('تفاصيل خطأ جلب المهام:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          // نستمر حتى لو فشل جلب المهام
          return { data: [] };
        });
      
      console.log('تم جلب المهام بنجاح:', tasksResponse.data);
      
      // تنظيم المهام حسب الحالة
      const groupedTasks = {
        todo: [],
        in_progress: [],
        done: []
      };
      
      tasksResponse.data.forEach(task => {
        if (groupedTasks[task.status]) {
          groupedTasks[task.status].push(task);
        } else {
          groupedTasks.todo.push(task);
        }
      });
      
      setTasks(groupedTasks);
      
      // جلب مستخدمي المؤسسة
      const organizationId = projectResponse.data.organization;
      console.log('جلب مستخدمي المؤسسة رقم:', organizationId);
    
      try {
        // جلب المستخدم الحالي أولاً للحصول على معلومات المؤسسة
        const currentUserResponse = await axios.get('/api/users/me/')
          .catch(error => {
            console.error('تفاصيل خطأ جلب المستخدم الحالي:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message
            });
            throw error;
          });
        
        console.log('معلومات المستخدم الحالي:', currentUserResponse.data);
        
        // جلب جميع المستخدمين في نفس المؤسسة
        const usersResponse = await axios.get('/api/users/')
          .catch(error => {
            console.error('تفاصيل خطأ جلب المستخدمين:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message
            });
            // نستمر حتى لو فشل جلب المستخدمين
            return { data: [] };
          });
        
        console.log('تم جلب المستخدمين:', usersResponse.data?.length || 0);
        
        // التأكد من أن البيانات صالحة
        if (Array.isArray(usersResponse.data) && usersResponse.data.length > 0) {
          // ترتيب المستخدمين بحيث يكون المشرفين في الأعلى
          const sortedUsers = [...usersResponse.data].sort((a, b) => {
            // المشرفين في الأعلى
            if (a.is_admin && !b.is_admin) return -1;
            if (!a.is_admin && b.is_admin) return 1;
            // ثم ترتيب أبجدي
            return a.username.localeCompare(b.username);
          });
          
          setUsers(sortedUsers);
          console.log('تم تعيين المستخدمين:', sortedUsers.length);
        } else {
          console.warn('لم يتم العثور على مستخدمين');
          setUsers([]);
        }
      } catch (userError) {
        console.error('خطأ في جلب المستخدمين:', userError);
        // نستمر حتى لو فشل جلب المستخدمين
        showNotification('فشل في جلب المستخدمين، لكن يمكنك متابعة العمل', 'warning');
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المشروع:', error);
      const errorMessage = error.response?.data?.error || error.response?.data || error.message || 'فشل في جلب بيانات المشروع';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // معالجة سحب وإفلات المهام
  const handleDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;
    
    // إذا لم يتم إفلات العنصر في منطقة صالحة
    if (!destination) return;
    
    // إذا تم إفلات العنصر في نفس المكان
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // استخراج معرف المهمة من معرف العنصر القابل للسحب
    const taskId = draggableId.split('-')[1];
    
    // نسخ حالة المهام الحالية
    const newTasks = { ...tasks };
    
    // العثور على المهمة
    const task = newTasks[source.droppableId].find(t => t.id.toString() === taskId);
    
    if (!task) return;
    
    // إزالة المهمة من العمود المصدر
    newTasks[source.droppableId] = newTasks[source.droppableId].filter(t => t.id.toString() !== taskId);
    
    // إضافة المهمة إلى العمود الوجهة
    const updatedTask = { ...task, status: destination.droppableId };
    newTasks[destination.droppableId] = [
      ...newTasks[destination.droppableId].slice(0, destination.index),
      updatedTask,
      ...newTasks[destination.droppableId].slice(destination.index)
    ];
    
    // تحديث الحالة المحلية
    setTasks(newTasks);
    
    // إرسال التحديث إلى الخادم
    try {
      await axios.patch(`/api/tasks/${taskId}/`, {
        status: destination.droppableId
      });
      
      showNotification('تم تحديث حالة المهمة بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
      showNotification('فشل في تحديث حالة المهمة', 'error');
      
      // استعادة الحالة السابقة في حالة الخطأ
      fetchProjectData();
    }
  }, [tasks, projectId]);
  
  // فتح نافذة إنشاء مهمة جديدة
  const handleAddTask = (status) => {
    setCurrentTask(null);
    setInitialStatus(status);
    setTaskFormOpen(true);
  };
  
  // فتح نافذة تعديل مهمة
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setInitialStatus('');
    setTaskFormOpen(true);
  };
  
  // فتح نافذة تأكيد حذف مهمة
  const handleDeleteClick = (task) => {
    setCurrentTask(task);
    setDeleteDialogOpen(true);
  };
  
  // حفظ المهمة (إنشاء أو تعديل)
  const handleSaveTask = async (formData) => {
    try {
      // التأكد من وجود البيانات الإلزامية
      if (!formData.title || !formData.title.trim()) {
        showNotification('عنوان المهمة مطلوب', 'error');
        return;
      }
      
      // إضافة رقم المشروع إلى البيانات
      const taskData = {
        ...formData,
        project: projectId
      };
      
      let response;
      
      if (currentTask) {
        // تعديل مهمة موجودة
        console.log('تعديل المهمة الحالية:', currentTask.id, 'بالبيانات:', taskData);
        response = await axios.patch(`/api/tasks/${currentTask.id}/`, taskData);
        
        // تحديث المهام في الحالة
        const updatedTasks = { ...tasks };
        
        // إزالة المهمة من العمود السابق
        Object.keys(updatedTasks).forEach(status => {
          updatedTasks[status] = updatedTasks[status].filter(t => t.id !== currentTask.id);
        });
        
        // إضافة المهمة المحدثة إلى العمود الجديد
        if (!updatedTasks[response.data.status]) {
          updatedTasks[response.data.status] = [];
        }
        updatedTasks[response.data.status].push(response.data);
        
        setTasks(updatedTasks);
        showNotification('تم تحديث المهمة بنجاح');
      } else {
        // إنشاء مهمة جديدة
        console.log('إنشاء مهمة جديدة للمشروع:', projectId);
        console.log('بيانات المهمة للإرسال:', taskData);
        
        try {
          // محاولة إنشاء المهمة باستخدام نقطة نهاية add_task
          response = await axios.post(`/api/projects/${projectId}/add_task/`, taskData);
          console.log('تم إنشاء المهمة بنجاح باستخدام add_task:', response.data);
        } catch (addTaskError) {
          console.error('خطأ في إنشاء المهمة باستخدام add_task:', addTaskError);
          
          // محاولة إنشاء المهمة باستخدام نقطة نهاية tasks
          console.log('محاولة إنشاء المهمة باستخدام نقطة نهاية tasks');
          response = await axios.post('/api/tasks/', taskData);
          console.log('تم إنشاء المهمة بنجاح باستخدام tasks:', response.data);
        }
        
        // إضافة المهمة الجديدة إلى الحالة
        const newTask = response.data;
        
        const updatedTasks = { ...tasks };
        if (!updatedTasks[newTask.status]) {
          updatedTasks[newTask.status] = [];
        }
        
        updatedTasks[newTask.status].push(newTask);
        setTasks(updatedTasks);
        showNotification('تم إنشاء المهمة بنجاح');
      }
      
      // إغلاق نافذة المهمة
      setTaskFormOpen(false);
      return response.data;
    } catch (error) {
      console.error('خطأ في حفظ المهمة:', error);
      
      let errorMessage = 'حدث خطأ أثناء حفظ المهمة';
      
      if (error.response) {
        console.error('خطأ الاستجابة:', error.response);
        
        // محاولة الحصول على رسالة خطأ أكثر تحديداً
        if (error.response?.data) {
          if (typeof error.response.data === 'object') {
            if (error.response.data.error) {
              errorMessage = error.response.data.error;
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      setTaskFormOpen(false);
    }
  };
  
  // حذف المهمة
  const handleDeleteTask = async () => {
    if (!currentTask) return;
    
    try {
      console.log('محاولة حذف المهمة برقم:', currentTask.id);
      await axios.delete(`/api/tasks/${currentTask.id}/`);
      
      // إزالة المهمة من الحالة
      const updatedTasks = { ...tasks };
      updatedTasks[currentTask.status] = updatedTasks[currentTask.status].filter(t => t.id !== currentTask.id);
      
      setTasks(updatedTasks);
      setDeleteDialogOpen(false);
      showNotification('تم حذف المهمة بنجاح');
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error);
      
      // الحصول على رسالة خطأ مفصلة
      let errorMessage = 'فشل في حذف المهمة';
      
      if (error.response) {
        console.error('تفاصيل خطأ الاستجابة:', error.response);
        
        if (error.response.data) {
          if (typeof error.response.data === 'object' && error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
      }
      
      showNotification(errorMessage, 'error');
      setDeleteDialogOpen(false); // إغلاق نافذة الحذف حتى في حالة الخطأ
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
  
  // العودة إلى صفحة المشاريع
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // فتح نافذة تفاصيل المهمة
  const handleViewTaskDetails = (task) => {
    setCurrentTask(task);
    setTaskDetailOpen(true);
  };
  
  // إغلاق نافذة تفاصيل المهمة
  const handleCloseTaskDetails = () => {
    setTaskDetailOpen(false);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {project?.title}
          </Typography>
          
          {project?.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {project.description}
            </Typography>
          )}
        </Box>
      </Box>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3}>
          {statusColumns.map(column => (
            <Grid item xs={12} md={4} key={column.id}>
              <TaskColumn
                status={column.id}
                tasks={tasks[column.id] || []}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteClick}
                onViewTaskDetails={handleViewTaskDetails}
              />
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
      
      {/* نافذة إنشاء/تعديل المهمة */}
      <TaskFormDialog
        open={taskFormOpen}
        task={currentTask}
        projectId={projectId}
        users={users}
        onClose={() => setTaskFormOpen(false)}
        onSave={handleSaveTask}
      />
      
      {/* نافذة تأكيد الحذف */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        task={currentTask}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteTask}
      />
      
      {/* نافذة تفاصيل المهمة مع التعليقات */}
      <TaskDetailDialog
        open={taskDetailOpen}
        task={currentTask}
        onClose={handleCloseTaskDetails}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
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

export default ProjectBoard;
