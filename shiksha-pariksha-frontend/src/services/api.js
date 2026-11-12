import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Restore token on page load
const stored = localStorage.getItem('sp_token');
if (stored) api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(token => {
          original.headers['Authorization'] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('sp_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        queue.forEach(p => p.resolve(newToken));
        queue = [];
        isRefreshing = false;
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        queue.forEach(p => p.reject(refreshErr));
        queue = [];
        isRefreshing = false;
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
