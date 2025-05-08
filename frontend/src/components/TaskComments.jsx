import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, Typography, Divider, TextField, Button, 
  Avatar, IconButton, Paper, CircularProgress,
  Card, CardContent, Tooltip, Snackbar, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AuthContext } from '../contexts/AuthContext';
import axios from '../api/axios';

// تنسيق مخصص للتعليقات
const CommentCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  position: 'relative',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  }
}));

// مكون التعليق الفردي
const CommentItem = ({ comment, onEdit, onDelete, currentUser }) => {
  // التحقق من صلاحيات المستخدم
  const isAuthor = currentUser && comment.author === currentUser.id; // هل المستخدم هو مؤلف التعليق
  const isAdmin = currentUser && currentUser.is_admin; // هل المستخدم مشرف مؤسسة
  const isSystemOwner = currentUser && currentUser.is_system_owner; // هل المستخدم مالك النظام
  
  // تحديد صلاحيات التعديل والحذف
  const canEdit = isAuthor; // فقط مؤلف التعليق يمكنه تعديله
  const canDelete = isAuthor || isAdmin || isSystemOwner; // مؤلف التعليق أو مشرف المؤسسة أو مالك النظام يمكنهم حذفه
  
  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };
  
  return (
    <CommentCard>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Avatar 
            sx={{ 
              mr: 2, 
              bgcolor: comment.author_detail?.color || '#1976d2',
              width: 40,
              height: 40
            }}
          >
            {comment.author_detail?.first_name?.charAt(0) || 
             comment.author_detail?.username?.charAt(0) || 'U'}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {comment.author_detail?.first_name 
                  ? `${comment.author_detail.first_name} ${comment.author_detail.last_name || ''}` 
                  : comment.author_detail?.username || 'مستخدم'}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                {formatDate(comment.created_at)}
                {comment.is_edited && ' (معدل)'}
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {comment.content}
            </Typography>
          </Box>
        </Box>
        
        {/* أزرار التعديل والحذف */}
        {(canEdit || canDelete) && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            {canEdit && (
              <Tooltip title={isAuthor ? "تعديل تعليقك" : "لا يمكن تعديل التعليق إلا بواسطة مؤلفه"}>
                <IconButton 
                  size="small" 
                  onClick={() => onEdit(comment)}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {canDelete && (
              <Tooltip title={
                isAuthor ? "حذف تعليقك" : 
                isAdmin ? "حذف التعليق (بصفتك مشرف مؤسسة)" : 
                isSystemOwner ? "حذف التعليق (بصفتك مالك النظام)" : "حذف"
              }>
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(comment)}
                  color="error"
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(211, 47, 47, 0.1)' // لون خلفية أحمر فاتح عند التحويم
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardContent>
    </CommentCard>
  );
};

// مكون نموذج إضافة تعليق جديد
const CommentForm = ({ taskId, onCommentAdded, editingComment, onCancelEdit }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
    } else {
      setContent('');
    }
  }, [editingComment]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('لا يمكن إضافة تعليق فارغ');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (editingComment) {
        // تعديل تعليق موجود
        response = await axios.put(`/api/comments/${editingComment.id}/`, {
          content: content.trim(),
          task: taskId
        });
      } else {
        // إضافة تعليق جديد
        response = await axios.post('/api/comments/', {
          content: content.trim(),
          task: taskId
        });
      }
      
      // تنظيف النموذج
      setContent('');
      
      // إعلام المكون الأب بالتغيير
      onCommentAdded(response.data);
      
      // إلغاء وضع التعديل إذا كان نشطًا
      if (editingComment) {
        onCancelEdit();
      }
    } catch (err) {
      console.error('خطأ في إضافة/تعديل التعليق:', err);
      setError(err.response?.data?.detail || 'حدث خطأ أثناء معالجة التعليق');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder={editingComment ? "تعديل التعليق..." : "أضف تعليقًا..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        error={!!error}
        helperText={error}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {editingComment && (
          <Button 
            variant="outlined" 
            onClick={onCancelEdit}
            disabled={loading}
            sx={{ ml: 1 }}
          >
            إلغاء
          </Button>
        )}
        
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          disabled={loading || !content.trim()}
          endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {editingComment ? 'تحديث' : 'إرسال'}
        </Button>
      </Box>
    </Box>
  );
};

// المكون الرئيسي للتعليقات
const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useContext(AuthContext);
  
  // جلب التعليقات
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/comments/task/${taskId}/`);
      setComments(response.data);
    } catch (err) {
      console.error('خطأ في جلب التعليقات:', err);
      showNotification('فشل في جلب التعليقات', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // جلب التعليقات عند تحميل المكون أو تغيير المهمة
  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);
  
  // إظهار إشعار
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // معالجة إضافة/تعديل تعليق
  const handleCommentAdded = (newComment) => {
    if (editingComment) {
      // تحديث التعليق في القائمة
      setComments(comments.map(comment => 
        comment.id === newComment.id ? newComment : comment
      ));
      showNotification('تم تعديل التعليق بنجاح');
    } else {
      // إضافة التعليق الجديد للقائمة
      setComments([...comments, newComment]);
      showNotification('تم إضافة التعليق بنجاح');
    }
  };
  
  // معالجة حذف تعليق
  const handleDeleteComment = async (comment) => {
    try {
      await axios.delete(`/api/comments/${comment.id}/`);
      
      // إزالة التعليق من القائمة
      setComments(comments.filter(c => c.id !== comment.id));
      showNotification('تم حذف التعليق بنجاح');
      
      // إلغاء وضع التعديل إذا كان التعليق المحذوف هو الذي يتم تعديله
      if (editingComment && editingComment.id === comment.id) {
        setEditingComment(null);
      }
    } catch (err) {
      console.error('خطأ في حذف التعليق:', err);
      showNotification('فشل في حذف التعليق', 'error');
    }
  };
  
  // معالجة تعديل تعليق
  const handleEditComment = (comment) => {
    setEditingComment(comment);
  };
  
  // إلغاء وضع التعديل
  const handleCancelEdit = () => {
    setEditingComment(null);
  };
  
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        التعليقات ({comments.length})
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* نموذج إضافة/تعديل تعليق */}
      <CommentForm 
        taskId={taskId}
        onCommentAdded={handleCommentAdded}
        editingComment={editingComment}
        onCancelEdit={handleCancelEdit}
      />
      
      {/* قائمة التعليقات */}
      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              currentUser={user}
            />
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography color="text.secondary">
              لا توجد تعليقات بعد. كن أول من يضيف تعليقًا!
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* إشعارات */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskComments;
