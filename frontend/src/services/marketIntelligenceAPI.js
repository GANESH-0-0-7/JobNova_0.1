import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const marketIntelligenceAPI = {
  // Get comprehensive market intelligence data
  getMarketIntelligence: async (jobTitle, location) => {
    try {
      const response = await api.get(`/market-intelligence/${encodeURIComponent(jobTitle)}/${encodeURIComponent(location)}`);
      if (response.data?.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Market Intelligence API Error:', error);
      throw error;
    }
  },

  // Get quick market stats
  getMarketStats: async (jobTitle, location = 'India') => {
    try {
      const response = await api.get(`/market-stats/${encodeURIComponent(jobTitle)}`, {
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('Market Stats API Error:', error);
      throw error;
    }
  },

  // Get trending skills for a job title
  getTrendingSkills: async (jobTitle, location = 'India') => {
    try {
      const response = await api.get(`/trending-skills/${encodeURIComponent(jobTitle)}`, {
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('Trending Skills API Error:', error);
      throw error;
    }
  }
};

export default marketIntelligenceAPI;