import { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import jwtDecode from 'jwt-decode';

// إنشاء سياق المصادقة
export const AuthContext = createContext();

// مزود سياق المصادقة
export const AuthProvider = ({ children }) => {
  // إضافة وضع التجاوز للمصادقة
  const [bypassAuth, setBypassAuth] = useState(false); // تعيين القيمة إلى false لإلزام المستخدم بتسجيل الدخول
  const [user, setUser] = useState(bypassAuth ? { 
    id: 1, 
    username: 'مستخدم افتراضي', 
    email: 'user@example.com', 
    is_admin: true,
    is_system_owner: true,
    // مالك النظام لا ينتمي لأي مؤسسة
    organization: null
  } : null);
  const [loading, setLoading] = useState(!bypassAuth);
  const [error, setError] = useState(null);

  // التحقق من وجود رمز مميز (token) عند تحميل التطبيق
  useEffect(() => {
    // إذا كان وضع التجاوز مفعل، لا تقم بأي عمليات مصادقة
    if (bypassAuth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          // التحقق من صلاحية الرمز المميز
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            // جلب بيانات المستخدم
            await fetchUserData();
          } else {
            // تجديد الرمز المميز إذا كان منتهي الصلاحية
            await refreshToken();
          }
        } catch (error) {
          console.error('خطأ في التحقق من الرمز المميز:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [bypassAuth]);

  // جلب بيانات المستخدم الحالي
  const fetchUserData = async () => {
    // إذا كان وضع التجاوز مفعل، لا تقم بجلب بيانات المستخدم
    if (bypassAuth) return;

    try {
      const response = await axios.get('/api/users/me/');
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
      setError('فشل في جلب بيانات المستخدم');
      logout();
    }
  };

  // تجديد الرمز المميز
  const refreshToken = async () => {
    // إذا كان وضع التجاوز مفعل، لا تقم بتجديد الرمز المميز
    if (bypassAuth) return;

    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      logout();
      return;
    }
    
    try {
      const response = await axios.post('/api/token/refresh/', {
        refresh: refreshToken
      });
      
      localStorage.setItem('access_token', response.data.access);
      
      await fetchUserData();
    } catch (error) {
      console.error('خطأ في تجديد الرمز المميز:', error);
      logout();
    }
  };

  // تسجيل الدخول
  const login = async (username, password) => {
    // إذا كان وضع التجاوز مفعل، قم بتسجيل الدخول مباشرة
    if (bypassAuth) {
      return { success: true };
    }

    try {
      const response = await axios.post('/api/login/', {
        username,
        password
      });
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      await fetchUserData();
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError(error.response?.data?.detail || 'فشل في تسجيل الدخول');
      
      return { 
        success: false, 
        message: error.response?.data?.detail || 'اسم المستخدم أو كلمة المرور غير صحيحة'
      };
    }
  };

  // تسجيل مستخدم جديد
  const signup = async (userData) => {
    // إذا كان وضع التجاوز مفعل، قم بتسجيل المستخدم مباشرة
    if (bypassAuth) {
      return { success: true };
    }

    try {
      console.log('جاري إرسال بيانات التسجيل:', userData);
      
      // إضافة معالجة خطأ محددة للاتصال بالخادم
      let response;
      try {
        response = await axios.post('/api/signup/', userData);
      } catch (apiError) {
        console.error('خطأ في الاتصال بالخادم:', apiError);
        if (apiError.response) {
          throw apiError; // إعادة رمي الخطأ إذا كان هناك استجابة من الخادم
        } else {
          throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
        }
      }
      
      console.log('استجابة التسجيل:', response.data);
      
      // التحقق من وجود رموز المصادقة في الاستجابة
      if (!response.data.access || !response.data.refresh) {
        throw new Error('لم يتم استلام رموز المصادقة من الخادم');
      }
      
      // حفظ رموز المصادقة
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // تعيين بيانات المستخدم في الحالة
      const userInfo = response.data.user;
      if (!userInfo) {
        throw new Error('لم يتم استلام بيانات المستخدم من الخادم');
      }
      
      setUser(userInfo);
      setError(null);
      
      // طباعة بيانات المستخدم للتحقق
      console.log('تم تعيين المستخدم بنجاح:', userInfo);
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('خطأ في إنشاء حساب جديد:', error);
      
      // تحسين معالجة الأخطاء
      let errorMessage = 'فشل في إنشاء حساب جديد';
      let errorDetails = {};
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.detail || errorMessage;
        errorDetails = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      return { 
        success: false, 
        message: errorMessage,
        errors: errorDetails
      };
    }
  };

  // تسجيل الخروج
  const logout = () => {
    // إذا كان وضع التجاوز مفعل، لا تقم بتسجيل الخروج
    if (bypassAuth) {
      return;
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
  };

  // تبديل وضع التجاوز
  const toggleBypassAuth = () => {
    setBypassAuth(!bypassAuth);
    if (!bypassAuth) {
      // إذا تم تفعيل وضع التجاوز، قم بتعيين مستخدم افتراضي
      setUser({ 
        id: 1, 
        username: 'مستخدم افتراضي', 
        email: 'user@example.com', 
        is_admin: true,
        is_system_owner: true,
        organization: null
      });
    } else {
      // إذا تم إلغاء وضع التجاوز، قم بتسجيل الخروج
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setError(null);
    }
  };

  // تحديد ما إذا كان المستخدم مسجل الدخول
  const isAuthenticated = !!user || bypassAuth;

  // القيم التي سيتم توفيرها للتطبيق
  const value = {
    user,
    loading,
    error,
    bypassAuth,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshToken,
    fetchUserData,
    toggleBypassAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
