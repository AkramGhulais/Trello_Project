import { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AuthProvider, { AuthContext } from './contexts/AuthContext';
import WebSocketProvider from './contexts/WebSocketContext';

// استيراد الصفحات
import Login from './pages/Login';
import Signup from './pages/SignupNew';
import DirectSignup from './pages/DirectSignup';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import Profile from './pages/Profile';
import UsersManagement from './pages/UsersManagement';
import OrganizationsManagement from './pages/OrganizationsManagement';
// Removed SystemOwnerPanel and OrganizationProjects imports as they are no longer needed
import DashboardOrganizationProjects from './pages/DashboardOrganizationProjects';
import NotFound from './pages/NotFound';

// استيراد المكونات
import Layout from './components/layout/Layout';

// مكون الحماية للمسارات
const ProtectedRoute = ({ children }) => {
  const { user, loading, bypassAuth } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // إذا كان وضع التجاوز مفعل، اعرض المحتوى مباشرة
  if (bypassAuth) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// مكون الحماية لمسارات مالك النظام
const SystemOwnerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.is_system_owner) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// مكون المسارات العامة
const PublicRoute = ({ children }) => {
  const { user, loading, bypassAuth } = useContext(AuthContext);
  const location = useLocation();
  const currentPath = location.pathname;

  // إظهار مؤشر التحميل أثناء تحميل بيانات المستخدم
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // إذا كان وضع التجاوز مفعل، قم بتوجيه المستخدم إلى لوحة التحكم
  if (bypassAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  // دائماً اسمح بالوصول إلى صفحة التسجيل وتسجيل الدخول للمستخدمين غير المسجلين
  if (currentPath === '/signup' || currentPath === '/login') {
    // إذا لم يكن المستخدم مسجل الدخول، اسمح بالوصول إلى صفحات التسجيل وتسجيل الدخول
    if (!user) {
      return children;
    }
    // إذا كان المستخدم مسجل الدخول بالفعل، قم بتوجيهه إلى لوحة التحكم
    return <Navigate to="/dashboard" replace />;
  }

  // للمسارات الأخرى، إذا كان المستخدم مسجل الدخول، قم بتوجيهه إلى لوحة التحكم
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// المكون الرئيسي للتطبيق
function AppContent() {
  const { bypassAuth } = useContext(AuthContext);

  // إذا كان وضع التجاوز مفعل، قم بتوجيه المستخدم مباشرة إلى لوحة التحكم عند فتح الصفحة الرئيسية
  useEffect(() => {
    if (bypassAuth && window.location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, [bypassAuth]);

  return (
    <Routes>
      {/* المسارات العامة */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      
      {/* مسار مباشر لصفحة التسجيل الجديدة بدون فحص المصادقة */}
      <Route path="/register" element={<DirectSignup />} />

      {/* المسارات المحمية */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects/:projectId" element={<ProjectBoard />} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
        <Route path="organizations" element={<ProtectedRoute><OrganizationsManagement /></ProtectedRoute>} />
        <Route path="dashboard/organizations/:orgId/projects" element={<ProtectedRoute><DashboardOrganizationProjects /></ProtectedRoute>} />
      </Route>

      {/* مسار غير موجود */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// تغليف التطبيق بمزودي السياق
function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
