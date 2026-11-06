import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (data?.data?.accessToken) {
          localStorage.setItem('vms_access_token', data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('vms_access_token');
        localStorage.removeItem('vms_user');

        // Only redirect to login if currently on a protected route
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/supabase-test') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Service API Methods
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const visitService = {
  getVisits: (params) => api.get('/visits', { params }),
  getTodayVisits: () => api.get('/visits/today'),
  createVisit: (payload) => api.post('/visits', payload),
  createKioskVisit: (payload) => api.post('/visits/kiosk', payload),
  getPass: (id) => api.get(`/visits/pass/${id}`),
  checkIn: (id) => api.patch(`/visits/${id}/check-in`),
  checkOut: (id) => api.patch(`/visits/${id}/check-out`),
  approve: (id) => api.patch(`/visits/${id}/approve`),
  reject: (id, reason) => api.patch(`/visits/${id}/reject`, { reason }),
  getEmergencyManifest: () => api.get('/visits/emergency'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getTrends: () => api.get('/dashboard/trends'),
};

export const userService = {
  getHosts: () => api.get('/users/hosts'),
  getUsers: (params) => api.get('/users', { params }),
  createUser: (payload) => api.post('/users', payload),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload),
};

export const departmentService = {
  getDepartments: () => api.get('/departments'),
  createDepartment: (payload) => api.post('/departments', payload),
};

export const reportService = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  downloadCsvUrl: (params) => {
    const searchParams = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/reports/export/csv?${searchParams}`;
  },
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

