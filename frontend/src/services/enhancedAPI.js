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

    const isAuthRoute = originalRequest?.url?.includes('/auth/signin') || 
                        originalRequest?.url?.includes('/auth/signup') || 
                        originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.get('/auth/refresh');
        
        if (refreshResponse.success && refreshResponse.data.token) {
          const newToken = refreshResponse.data.token;
          
          localStorage.setItem('token', newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          const retryResponse = await axios({
             ...originalRequest,
             baseURL: '',
          });
          return retryResponse.data;
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        const message = refreshError.response?.data?.message || 'Session expired. Please log in again.';
        throw new Error(message);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute && localStorage.getItem('token')) {
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       window.location.href = '/';
    }
    
    let message = 'Request failed';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }
    
    if (error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Network error - backend server may be unavailable';
    }
    
    throw new Error(message);
  }
);


const jobAPI = {

  getAllJobs: (params = {}) => api.get('/jobs', { params }),
  getJobs: (params = {}) => api.get('/jobs', { params }),
  
  getJobNovaId: (id) => api.get(`/jobs/${id}`),
  
  createJob: async (jobData) => {
    try {
      return await api.post('/jobs', jobData);
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error') || error.message.includes('Validation failed')) {
        const mockJob = {
          _id: Date.now().toString(),
          ...jobData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          isActive: true,
          applicationCount: 0,
          viewsCount: 0,
          postedAgo: 'Just now',
          employer: {
            name: 'Current User',
            id: 'mock-employer-id'
          }
        };
        
        const existingJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
        existingJobs.unshift(mockJob);
        localStorage.setItem('postedJobs', JSON.stringify(existingJobs));
        
        console.log('Backend unavailable, using mock data for job creation:', mockJob);
        return { data: mockJob, message: 'Job created successfully (mock)' };
      }
      throw error;
    }
  },
  
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  
  deleteJob: (id) => api.delete(`/jobs/${id}`),

  getMyJobs: (params = {}) => api.get('/jobs/employer/my-jobs', { params }),
  
  getJobStats: () => api.get('/jobs/employer/stats'),
  
  searchJobs: (query, filters = {}) => api.get('/jobs/search', { 
    params: { q: query, ...filters } 
  }),
  
  getJobsByCategory: (category) => api.get(`/jobs/category/${category}`),
  
  getFeaturedJobs: () => api.get('/jobs/featured'),
  
  getRecentJobs: (limit = 10) => api.get('/jobs/recent', { params: { limit } }),
  
  getRecommendedJobs: (params = {}) => api.get('/jobs/recommended', { params }),
  
  getSimilarJobs: (jobId) => api.get(`/jobs/${jobId}/similar`),
};


const applicationAPI = {
  applyForJob: (jobId, applicationData) => {
    const formData = new FormData();
    Object.keys(applicationData).forEach(key => {
      if (applicationData[key] instanceof File) {
        formData.append(key, applicationData[key]);
      } else if (applicationData[key] !== null && applicationData[key] !== undefined) {
        formData.append(key, applicationData[key]);
      }
    });
    
    return api.post(`/applications/apply/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getMyApplications: (params = {}) => api.get('/applications/my-applications', { params }),
  
  getJobApplications: (jobId, params = {}) => 
    api.get(`/applications/job/${jobId}`, { params }),
  
  updateApplicationStatus: (applicationId, statusData) =>
    api.patch(`/applications/status/${applicationId}`, statusData),
  
  getApplicationById: (id) => api.get(`/applications/${id}`),
  
  withdrawApplication: (applicationId) => 
    api.patch(`/applications/withdraw/${applicationId}`),
  
  scheduleInterview: (applicationId, interviewData) =>
    api.post(`/applications/${applicationId}/interview`, interviewData),
  
  getApplicationStats: (jobId) => api.get(`/applications/stats/${jobId}`),
  
  getApplicationsByStatus: (status) => 
    api.get(`/applications/status/${status}`),
  
  addApplicationNote: (applicationId, note) =>
    api.post(`/applications/${applicationId}/notes`, { note }),
  
  getApplicationTimeline: (applicationId) =>
    api.get(`/applications/${applicationId}/timeline`),
};

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
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, newPassword) => 
    api.post('/auth/reset-password', { token, newPassword }),
  
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

const companyAPI = {
  getCompanies: (params = {}) => api.get('/companies', { params }),
  
  getCompanyById: (id) => api.get(`/companies/${id}`),
  
  updateCompany: (companyData) => api.put('/companies/profile', companyData),
  
  getCompanyJobs: (companyId, params = {}) => 
    api.get(`/companies/${companyId}/jobs`, { params }),
  
  getCompanyStats: (companyId) => api.get(`/companies/${companyId}/stats`),
  
  followCompany: (companyId) => api.post(`/companies/${companyId}/follow`),
  unfollowCompany: (companyId) => api.delete(`/companies/${companyId}/follow`),
  
  getFollowedCompanies: () => api.get('/companies/followed'),
};

const filtersAPI = {
  getCategories: () => api.get('/categories'),
  
  getLocations: () => api.get('/locations'),
  
  getSkills: () => api.get('/skills'),
  
  getEmploymentTypes: () => api.get('/employment-types'),
  
  getSalaryRanges: () => api.get('/salary-ranges'),
  
  getExperienceLevels: () => api.get('/experience-levels'),
  
  getJobTypes: () => api.get('/job-types'),
};

const fileAPI = {
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/files/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadCoverLetter: (file) => {
    const formData = new FormData();
    formData.append('coverLetter', file);
    return api.post('/files/upload-cover-letter', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadCompanyLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/files/upload-company-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  downloadFile: (fileId) => api.get(`/files/download/${fileId}`, {
    responseType: 'blob'
  }),
  
  getFileInfo: (fileId) => api.get(`/files/info/${fileId}`),
};

const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  
  getNotificationSettings: () => api.get('/notifications/settings'),
  
  updateNotificationSettings: (settings) => api.put('/notifications/settings', settings),
};

const aiAPI = {
  generateCoverLetter: (data) => api.post('/ai/cover-letter', data),
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
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token && !isTokenExpired(token);
  },
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  getUserRole: () => {
    const user = tokenManager.getUser();
    return user?.role || null;
  },
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

export { 
  authAPI, 
  jobAPI, 
  applicationAPI, 
  companyAPI,
  filtersAPI,
  fileAPI,
  notificationAPI,
  aiAPI,
  tokenManager 
};

export default api;