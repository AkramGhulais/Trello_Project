import React, { useState, useEffect, useContext } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, Divider, Chip, Avatar,
  CircularProgress, IconButton, Tooltip, Tab, Tabs
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import { AuthContext } from '../contexts/AuthContext';
import TaskComments from './TaskComments';

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

// الحصول على ترجمة الحالة
const getStatusLabel = (status) => {
  switch (status) {
    case 'todo': return 'قيد الانتظار';
    case 'in_progress': return 'قيد التنفيذ';
    case 'done': return 'مكتملة';
    default: return status;
  }
};

// الحصول على لون الحالة
const getStatusColor = (status) => {
  switch (status) {
    case 'todo': return '#f44336';
    case 'in_progress': return '#ff9800';
    case 'done': return '#4caf50';
    default: return '#e0e0e0';
  }
};

const TaskDetailDialog = ({ open, task, onClose, onEdit, onDelete }) => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useContext(AuthContext);
  
  // إعادة تعيين التبويب عند فتح النافذة
  useEffect(() => {
    if (open) {
      setTabValue(0);
    }
  }, [open]);
  
  // التحقق من صلاحيات المستخدم
  const canEdit = user && (
    user.is_system_owner || 
    user.is_admin || 
    (task?.assignee?.id === user.id) ||
    (task?.project_detail?.owner?.id === user.id)
  );
  
  const canDelete = user && (
    user.is_system_owner || 
    user.is_admin || 
    (task?.project_detail?.owner?.id === user.id)
  );
  
  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };
  
  // معالجة تغيير التبويب
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  if (!task) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            {task.title}
          </Typography>
        </Box>
        
        <Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="التفاصيل" />
          <Tab label="التعليقات" />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        {tabValue === 0 ? (
          <Box>
            {/* معلومات المهمة */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                الوصف
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {task.description || 'لا يوجد وصف للمهمة'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* معلومات إضافية */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {/* المشروع */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  المشروع:
                </Typography>
                <Typography variant="body2">
                  {task.project_detail?.name || 'غير محدد'}
                </Typography>
              </Box>
              
              {/* الحالة */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  الحالة:
                </Typography>
                <Chip 
                  label={getStatusLabel(task.status)} 
                  size="small"
                  sx={{ 
                    bgcolor: getStatusColor(task.status),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              {/* المسؤول */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  المسؤول:
                </Typography>
                {task.assignee ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        bgcolor: task.assignee_detail?.color || '#1976d2',
                        fontSize: '0.75rem'
                      }}
                    >
                      {task.assignee_detail?.first_name?.charAt(0) || 
                       task.assignee_detail?.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2">
                      {task.assignee_detail?.first_name 
                        ? `${task.assignee_detail.first_name} ${task.assignee_detail.last_name || ''}` 
                        : task.assignee_detail?.username || 'مستخدم'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    غير معين
                  </Typography>
                )}
              </Box>
              
              {/* الأولوية */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  الأولوية:
                </Typography>
                <Chip 
                  icon={<FlagIcon />}
                  label={priorityOptions.find(opt => opt.value === (task.priority || 'medium'))?.label || 'متوسطة'} 
                  size="small"
                  sx={{ 
                    bgcolor: getPriorityColor(task.priority || 'medium'),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              {/* تاريخ الاستحقاق */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  تاريخ الاستحقاق:
                </Typography>
                <Typography variant="body2">
                  {formatDate(task.due_date)}
                </Typography>
              </Box>
              
              {/* تاريخ الإنشاء */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  تاريخ الإنشاء:
                </Typography>
                <Typography variant="body2">
                  {formatDate(task.created_at)}
                </Typography>
              </Box>
              
              {/* تاريخ آخر تحديث */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                  آخر تحديث:
                </Typography>
                <Typography variant="body2">
                  {formatDate(task.updated_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <TaskComments taskId={task.id} />
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        {canDelete && (
          <Tooltip title="حذف المهمة">
            <Button 
              onClick={() => onDelete(task)}
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
            >
              حذف
            </Button>
          </Tooltip>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button 
          onClick={onClose} 
          color="inherit"
        >
          إغلاق
        </Button>
        
        {canEdit && (
          <Tooltip title="تعديل المهمة">
            <Button 
              onClick={() => onEdit(task)}
              color="primary"
              variant="contained"
              startIcon={<EditIcon />}
            >
              تعديل
            </Button>
          </Tooltip>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;
