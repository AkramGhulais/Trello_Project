import axios from './axios';

// وظيفة تسجيل الدخول
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post('/api/login/', {
      username,
      password
    });
    
    // حفظ رموز المصادقة في التخزين المحلي
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return { 
      success: false, 
      message: error.response?.data?.detail || 'فشل في تسجيل الدخول'
    };
  }
};

// وظيفة إنشاء حساب جديد
export const signupUser = async (userData) => {
  try {
    console.log('بيانات التسجيل:', userData);
    const response = await axios.post('/api/signup/', userData);
    console.log('استجابة التسجيل:', response.data);
    
    // حفظ رموز المصادقة في التخزين المحلي
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('خطأ في إنشاء حساب جديد:', error);
    
    let errorMessage = 'فشل في إنشاء حساب جديد';
    let errorDetails = {};
    
    if (error.response && error.response.data) {
      errorMessage = error.response.data.detail || errorMessage;
      errorDetails = error.response.data;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      errors: errorDetails
    };
  }
};

// وظيفة تسجيل الخروج
export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  return { success: true };
};

// وظيفة جلب بيانات المستخدم الحالي
export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/api/users/me/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return { 
      success: false, 
      message: error.response?.data?.detail || 'فشل في جلب بيانات المستخدم'
    };
  }
};
