import axios from 'axios';

// إنشاء نسخة من axios مع الإعدادات الافتراضية
const instance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // زيادة المهلة لتجنب الأخطاء
  // تعطيل withCredentials لتجنب مشاكل CORS
  withCredentials: false,
});

// إضافة معلومات تصحيح الأخطاء
console.log('تم تهيئة Axios مع الإعدادات:', {
  baseURL: instance.defaults.baseURL,
  withCredentials: instance.defaults.withCredentials,
  headers: instance.defaults.headers
});

// إضافة معلومات تصحيح الأخطاء لمعرفة الطلبات التي يتم إرسالها
instance.interceptors.request.use(
  (config) => {
    console.log(`إرسال طلب إلى: ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('خطأ في إرسال الطلب:', error);
    return Promise.reject(error);
  }
);

// إضافة معترض للطلبات لإضافة رمز المصادقة إذا كان موجوداً
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة معترض للاستجابات للتعامل مع الأخطاء
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // إذا كان الخطأ 401 (غير مصرح) وليس طلب تجديد الرمز
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // محاولة تجديد الرمز
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken
        });
        
        // تحديث الرمز في التخزين المحلي
        localStorage.setItem('access_token', response.data.access);
        
        // إعادة إرسال الطلب الأصلي مع الرمز الجديد
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // إذا فشل تجديد الرمز، قم بتسجيل الخروج
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
