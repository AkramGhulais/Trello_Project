import { useState, useContext } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, AppBar, Toolbar, Typography, IconButton, 
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Avatar, Menu, MenuItem, Tooltip, Badge, Chip,
  useMediaQuery, useTheme, Button, Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ApartmentIcon from '@mui/icons-material/Apartment';
import KeyIcon from '@mui/icons-material/Key';
import DomainIcon from '@mui/icons-material/Domain';
import { AuthContext } from '../../contexts/AuthContext';

// عرض الدرج الجانبي
const DRAWER_WIDTH = 220;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // فتح/إغلاق القائمة الجانبية على الأجهزة المحمولة
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // فتح قائمة المستخدم
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // إغلاق قائمة المستخدم
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // فتح قائمة الإشعارات
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  // إغلاق قائمة الإشعارات
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  // تسجيل الخروج
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // التنقل إلى صفحة
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  // عناصر القائمة الجانبية
  const menuItems = [
    { text: 'لوحة التحكم', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'الملف الشخصي', icon: <PersonIcon />, path: '/profile' },
    // إظهار روابط الإدارة للمشرفين فقط
    ...(user?.is_admin ? [
      { text: 'إدارة المستخدمين', icon: <AdminPanelSettingsIcon />, path: '/users' },
      { text: 'إدارة المنظمات', icon: <BusinessIcon />, path: '/organizations' }
    ] : []),
    // لا نحتاج لروابط إضافية لمالك النظام لأن كل الوظائف مدمجة في لوحة التحكم الرئيسية
  ];
  
  // محتوى القائمة الجانبية
  const drawerContent = (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      {/* رأس السايدبار بنفس لون الناف بار */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 2,
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: '0 0 15px 15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative',
        mb: 2
      }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'white',
            color: 'primary.main',
            mb: 1,
            border: '3px solid white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {user?.username?.charAt(0) || <PersonIcon />}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
          {user?.username || 'مستخدم افتراضي'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {user?.email || 'user@example.com'}
        </Typography>
        {/* عرض شارة مالك النظام أو أدمن المؤسسة */}
        {user?.is_system_owner && (
          <Chip
            icon={<KeyIcon />}
            label="مالك النظام"
            size="small"
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 'bold',
              mt: 1,
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        )}
        {!user?.is_system_owner && user?.is_admin && (
          <Chip
            icon={<AdminPanelSettingsIcon />}
            label="أدمن المؤسسة"
            size="small"
            sx={{
              bgcolor: 'warning.main',
              color: 'white',
              fontWeight: 'bold',
              mt: 1,
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        )}
      </Box>
      
      <Box sx={{ px: 2, py: 1 }}>
        <List sx={{ 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mb: 0.5,
                borderRadius: '8px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ mt: 2, mb: 2 }} />
      
      <Box sx={{ px: 2, pb: 2 }}>
        <List sx={{ 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'rgba(211, 47, 47, 0.08)',
                color: 'error.main',
                '& .MuiListItemIcon-root': {
                  color: 'error.main',
                },
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="تسجيل الخروج" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: { xs: 0, md: '0 0 15px 15px' },
        }}>
          {/* زر القائمة للأجهزة المحمولة */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* شعار التطبيق واسم المؤسسة */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component={RouterLink} 
              to="/"
              sx={{ 
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                mr: 2
              }}
            >
              نظام إدارة المشاريع
            </Typography>
            
            {/* عرض اسم المؤسسة - لا يظهر لمالك النظام */}
            {user?.organization_detail && !user?.is_system_owner && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'rgba(255, 255, 255, 0.15)', 
                px: 2, 
                py: 0.5, 
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <ApartmentIcon sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user.organization_detail.name}
                </Typography>
              </Box>
            )}
            
            {/* عرض شارة مالك النظام في الشريط العلوي */}
            {user?.is_system_owner && (
              <Chip
                icon={<KeyIcon />}
                label="مالك النظام"
                size="small"
                sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  fontWeight: 'bold',
                  ml: 2,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            )}
            
            {/* عرض شارة أدمن المؤسسة في الشريط العلوي */}
            {!user?.is_system_owner && user?.is_admin && (
              <Chip
                icon={<AdminPanelSettingsIcon />}
                label="أدمن المؤسسة"
                size="small"
                sx={{
                  bgcolor: 'warning.main',
                  color: 'white',
                  fontWeight: 'bold',
                  ml: 2,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            )}
          </Box>
            
          
          {/* الإشعارات */}
          <Tooltip title="الإشعارات">
            <IconButton 
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{ mx: 1 }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* قائمة الإشعارات */}
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleNotificationsClose}>
              <Typography variant="body2">تم تعيين مهمة جديدة لك</Typography>
            </MenuItem>
            <MenuItem onClick={handleNotificationsClose}>
              <Typography variant="body2">تم تحديث حالة المهمة "تصميم الواجهة"</Typography>
            </MenuItem>
            <MenuItem onClick={handleNotificationsClose}>
              <Typography variant="body2">تم إضافتك إلى مشروع جديد</Typography>
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={handleNotificationsClose}
              sx={{ justifyContent: 'center', color: 'primary.main' }}
            >
              <Typography variant="body2">عرض كل الإشعارات</Typography>
            </MenuItem>
          </Menu>
          
          {/* زر الملف الشخصي */}
          <Tooltip title="الإعدادات">
            <IconButton 
              onClick={handleUserMenuOpen}
              sx={{ 
                p: 0,
                ml: 1,
                border: '2px solid white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.dark' }}>
                {user?.username?.charAt(0) || <PersonIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          {/* قائمة المستخدم */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => {
              handleUserMenuClose();
              navigate('/profile');
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">الملف الشخصي</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              handleUserMenuClose();
              handleLogout();
            }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">تسجيل الخروج</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* القائمة الجانبية */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 }, position: 'relative' }}
      >
        {/* القائمة الجانبية للأجهزة المحمولة */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // تحسين الأداء على الأجهزة المحمولة
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: 'none'
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* القائمة الجانبية للأجهزة المكتبية */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: 'none',
              mt: '64px', // إضافة هامش علوي لتجنب التداخل مع الناف بار
              height: 'calc(100% - 64px)', // ضبط الارتفاع لتجنب التداخل
              overflow: 'hidden',
              left: 0,
              right: 'auto'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      {/* المحتوى الرئيسي */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 0 }, // Removed padding on desktop
          pl: { md: 0 }, // No left padding on desktop
          pr: { md: 0 }, // No right padding on desktop
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          marginLeft: { xs: 0, md: 0 }, // Removed margin to eliminate gap
          transition: 'all 0.2s ease-out'
        }}
      >
        <Toolbar /> {/* مساحة للشريط العلوي */}
        <Box sx={{ 
          borderRadius: { xs: '12px', md: '0px' }, // No border radius on desktop
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          bgcolor: 'white',
          p: { xs: 2, md: 3 },
          width: '100%',
          maxWidth: '100%',
          height: 'calc(100vh - 64px)', // Make content fill available height
          overflowY: 'auto' // Add scrolling for content
        }}>
          <Outlet /> {/* عرض محتوى الصفحة الحالية */}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
