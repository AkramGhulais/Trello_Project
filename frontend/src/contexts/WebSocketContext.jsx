import { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from './AuthContext';

// إنشاء سياق WebSocket
export const WebSocketContext = createContext();

// مزود سياق WebSocket
export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [projectSubscriptions, setProjectSubscriptions] = useState([]);
  const { user } = useContext(AuthContext);
  
  // استخدام useRef للاحتفاظ بكائن WebSocket
  const wsRef = useRef(null);
  // استخدام useRef للاحتفاظ بمستمعي الأحداث
  const eventListeners = useRef({});

  // إنشاء اتصال WebSocket عند تسجيل دخول المستخدم
  useEffect(() => {
    // التحقق من وجود مستخدم مسجل الدخول
    if (user && user.id) {
      console.log('محاولة الاتصال بـ WebSocket للمستخدم:', user.username);
      connectWebSocket();
    } else {
      console.log('لا يوجد مستخدم مسجل الدخول - لن يتم الاتصال بـ WebSocket');
      disconnectWebSocket();
    }

    // تنظيف عند إزالة المكون
    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  // إنشاء اتصال WebSocket
  const connectWebSocket = () => {
    // التحقق من وجود اتصال مفتوح بالفعل
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('يوجد اتصال WebSocket مفتوح بالفعل');
      return;
    }
    
    // الحصول على رمز الوصول
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('لا يوجد رمز مصادقة - لن يتم الاتصال بـ WebSocket');
      return;
    }

    // إنشاء اتصال WebSocket مع إرسال الرمز المميز للمصادقة
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // استخدام العنوان المطلق للخادم بدلاً من window.location.host
    const backendHost = 'localhost:8000'; // تأكد من تغيير هذا ليناسب عنوان خادمك
    const wsUrl = `${wsProtocol}//${backendHost}/ws/`;
    
    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;
  
      // معالجة فتح الاتصال
      ws.onopen = () => {
        console.log('تم الاتصال بـ WebSocket');
        setConnected(true);
        
        // إعادة الاشتراك في المشاريع المشترك بها سابقًا
        projectSubscriptions.forEach(projectId => {
          subscribeToProject(projectId);
        });
      };
  
      // معالجة استلام الرسائل
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('تم استلام رسالة WebSocket:', data);
          
          // استدعاء مستمعي الأحداث المسجلين
          if (data.type && eventListeners.current[data.type]) {
            eventListeners.current[data.type].forEach(callback => {
              callback(data.payload || data);
            });
          }
        } catch (error) {
          console.error('خطأ في معالجة رسالة WebSocket:', error);
        }
      };
  
      // معالجة الأخطاء
      ws.onerror = (error) => {
        console.error('خطأ في اتصال WebSocket:', error);
        setConnected(false);
      };
  
      // معالجة إغلاق الاتصال
      ws.onclose = (event) => {
        console.log('تم إغلاق اتصال WebSocket:', event.code, event.reason);
        setConnected(false);
        
        // إعادة الاتصال تلقائيًا بعد فترة قصيرة إذا لم يكن الإغلاق متعمدًا
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('جاري إعادة الاتصال بـ WebSocket...');
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('خطأ في إنشاء اتصال WebSocket:', error);
    }
  };

  // إغلاق اتصال WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnected(false);
      setProjectSubscriptions([]);
      // إعادة تعيين مستمعي الأحداث
      eventListeners.current = {};
    }
  };

  // الاشتراك في تحديثات مشروع معين
  const subscribeToProject = (projectId) => {
    if (!wsRef.current || !connected) {
      // إضافة المشروع إلى قائمة الاشتراكات للاشتراك لاحقًا عند الاتصال
      if (!projectSubscriptions.includes(projectId)) {
        setProjectSubscriptions([...projectSubscriptions, projectId]);
      }
      return;
    }

    // إرسال رسالة اشتراك إلى الخادم
    wsRef.current.send(JSON.stringify({
      type: 'subscribe',
      project_id: projectId
    }));

    // إضافة المشروع إلى قائمة الاشتراكات
    if (!projectSubscriptions.includes(projectId)) {
      setProjectSubscriptions([...projectSubscriptions, projectId]);
    }
  };

  // إلغاء الاشتراك من تحديثات مشروع معين
  const unsubscribeFromProject = (projectId) => {
    if (!wsRef.current || !connected) return;

    // إرسال رسالة إلغاء اشتراك إلى الخادم
    wsRef.current.send(JSON.stringify({
      type: 'unsubscribe',
      project_id: projectId
    }));

    // إزالة المشروع من قائمة الاشتراكات
    setProjectSubscriptions(projectSubscriptions.filter(id => id !== projectId));
  };

  // إرسال رسالة عبر WebSocket
  const sendMessage = (message) => {
    if (!wsRef.current || !connected) return false;

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('خطأ في إرسال رسالة WebSocket:', error);
      return false;
    }
  };
  
  // إضافة مستمع حدث (مشابه لـ socket.on في Socket.io)
  const on = useCallback((eventName, callback) => {
    if (!eventListeners.current[eventName]) {
      eventListeners.current[eventName] = [];
    }
    eventListeners.current[eventName].push(callback);
  }, []);
  
  // إزالة مستمع حدث (مشابه لـ socket.off في Socket.io)
  const off = useCallback((eventName, callback) => {
    if (!eventListeners.current[eventName]) return;
    
    if (callback) {
      // إزالة مستمع محدد
      eventListeners.current[eventName] = eventListeners.current[eventName].filter(
        cb => cb !== callback
      );
    } else {
      // إزالة جميع المستمعين لهذا الحدث
      eventListeners.current[eventName] = [];
    }
  }, []);

  // القيم التي سيتم توفيرها للتطبيق
  const value = {
    socket: {
      on,
      off,
      send: sendMessage,
      connected
    },
    connected,
    subscribeToProject,
    unsubscribeFromProject,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
