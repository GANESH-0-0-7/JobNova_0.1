import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Optional: Avoid retrying login/signup/refresh requests
    const isAuthRoute = originalRequest.url.includes('/auth/signin') || 
                        originalRequest.url.includes('/auth/signup') || 
                        originalRequest.url.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using the http-only cookie
        const refreshResponse = await api.get('/auth/refresh');
        
        if (refreshResponse.success && refreshResponse.data.token) {
          const newToken = refreshResponse.data.token;
          
          // Update local storage token
          tokenManager.setToken(newToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Let's use axios(originalRequest) instead of api(originalRequest) directly
          // Wait, returning axios instance with config will use interceptors again.
          const retryResponse = await axios({
             ...originalRequest,
             baseURL: '', // avoid appending base url again if url is absolute, but originalRequest usually has full config
          });
          return retryResponse.data;
        }
      } catch (refreshError) {
        // If refresh fails, log out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        const message = refreshError.response?.data?.message || 'Session expired. Please log in again.';
        throw new Error(message);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute && localStorage.getItem('token')) {
       // fallback catch
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       window.location.href = '/';
    }

    const message = error.response?.data?.message || error.message || 'Request failed';
    throw new Error(message);
  }
);

const authAPI = {
  signUp: async (userData) => {
    return api.post('/auth/signup', userData);
  },

  signIn: async (credentials) => {
    return api.post('/auth/signin', credentials);
  },

  logout: async () => {
    return api.post('/auth/logout');
  },
};

const jobAPI = {
  getAllJobs: (params) => api.get('/jobs', { params }),
  getJobNovaId: (id) => api.get(`/jobs/${id}`),
  
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: (params) => api.get('/jobs/employer/my-jobs', { params }),
  getJobStats: () => api.get('/jobs/employer/stats'),
};

const applicationAPI = {
  applyForJob: (jobId, applicationData) => {
    const formData = new FormData();
    Object.keys(applicationData).forEach(key => {
      if (key === 'resume' && applicationData[key]) {
        formData.append('resume', applicationData[key]);
      } else {
        formData.append(key, applicationData[key]);
      }
    });
    return api.post(`/applications/apply/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMyApplications: (params) => api.get('/applications/my-applications', { params }),
  withdrawApplication: (id) => api.patch(`/applications/withdraw/${id}`),
  
  getJobApplications: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  getEmployerApplications: (params) => api.get('/applications/employer', { params }),
  updateApplicationStatus: (id, statusData) => api.patch(`/applications/status/${id}`, statusData),
  getApplicationStats: (jobId) => api.get(`/applications/stats/${jobId}`),
  
  getApplicationById: (id) => api.get(`/applications/${id}`),
};

const tokenManager = {
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
};

export { authAPI, jobAPI, applicationAPI, tokenManager };