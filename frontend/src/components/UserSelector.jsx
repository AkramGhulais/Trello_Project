import React, { useState, useEffect } from 'react';
import { 
  FormControl, InputLabel, Select, MenuItem, 
  Avatar, Typography, Box, Divider, TextField,
  InputAdornment, ListItem, FormHelperText
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';

/**
 * مكون مخصص لاختيار المستخدمين
 * @param {Object} props - خصائص المكون
 * @param {Array} props.users - قائمة المستخدمين
 * @param {string} props.value - قيمة المستخدم المحدد
 * @param {Function} props.onChange - دالة تُستدعى عند تغيير المستخدم المحدد
 * @param {string} props.label - عنوان حقل الاختيار
 * @param {string} props.helperText - نص المساعدة
 * @param {string} props.error - رسالة الخطأ
 */
const UserSelector = ({ 
  users = [], 
  value = '', 
  onChange, 
  label = 'المستخدم',
  helperText = '',
  error = ''
}) => {
  // تقسيم المستخدمين إلى مشرفين ومستخدمين عاديين
  const adminUsers = users.filter(user => user.is_admin);
  const normalUsers = users.filter(user => !user.is_admin);
  
  // حالة البحث
  const [searchTerm, setSearchTerm] = useState('');
  
  // معالجة تغيير المستخدم المحدد
  const handleChange = (event) => {
    console.log('تم اختيار المستخدم:', event.target.value);
    if (onChange) {
      onChange(event);
    }
  };
  
  // تصفية المستخدمين حسب مصطلح البحث
  const filterUsers = (userList) => {
    if (!searchTerm) return userList;
    return userList.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // الحصول على المستخدم المحدد
  const selectedUser = users.find(user => user.id === value);
  
  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel id="user-selector-label">{label}</InputLabel>
      <Select
        labelId="user-selector-label"
        id="user-selector"
        name="assignee"
        value={value}
        label={label}
        onChange={handleChange}
        renderValue={(selected) => {
          if (!selected) return <em>لا أحد</em>;
          if (selectedUser) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    mr: 1, 
                    bgcolor: selectedUser.is_admin ? 'secondary.main' : 'primary.main' 
                  }}
                >
                  {selectedUser.username.charAt(0)}
                </Avatar>
                <Typography>{selectedUser.username}</Typography>
              </Box>
            );
          }
          return <em>لا أحد</em>;
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300
            }
          }
        }}
      >
        {/* حقل البحث */}
        <ListItem sx={{ p: 1 }}>
          <TextField
            size="small"
            autoFocus
            placeholder="ابحث عن مستخدم..."
            fullWidth
            value={searchTerm}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </ListItem>
        <Divider />
        
        {/* خيار لا أحد */}
        <MenuItem value="">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'grey.300' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <em>لا أحد</em>
          </Box>
        </MenuItem>
        <Divider />
        
        {/* عرض المستخدمين المشرفين */}
        {adminUsers.length > 0 && (
          <>
            <Box sx={{ p: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                المشرفين
              </Typography>
            </Box>
            {filterUsers(adminUsers).map(user => (
              <MenuItem 
                key={user.id} 
                value={user.id}
                sx={{ py: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1, 
                      bgcolor: 'secondary.main',
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.username.charAt(0)}
                  </Avatar>
                  <Box sx={{ ml: 1, flexGrow: 1 }}>
                    <Typography variant="body1">{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <AdminPanelSettingsIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                      مشرف
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </>
        )}
        
        {/* عرض المستخدمين العاديين */}
        {normalUsers.length > 0 && (
          <>
            <Box sx={{ p: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                المستخدمين
              </Typography>
            </Box>
            {filterUsers(normalUsers).map(user => (
              <MenuItem 
                key={user.id} 
                value={user.id}
                sx={{ py: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1, 
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.username.charAt(0)}
                  </Avatar>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1">{user.username}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </>
        )}
        
        {/* رسالة في حالة عدم وجود مستخدمين */}
        {users.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ width: '100%', py: 2 }}>
              لم يتم العثور على مستخدمين
            </Typography>
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
};

export default UserSelector;
