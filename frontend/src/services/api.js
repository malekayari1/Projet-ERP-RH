import axios from 'axios';

// Le backend tourne maintenant sur le port 5001
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (data) =>
  api.post('/auth/register', data);

export const getCurrentUser = () =>
  api.get('/auth/me');

// ==================== DASHBOARD API ====================
export const getDashboardStats = () =>
  api.get('/dashboard/stats');

export const getRecentActivities = () =>
  api.get('/dashboard/activities');

export const getGlobalStats = (params = {}) =>
  api.get('/dashboard/global-stats', { params });

// ==================== USERS/EMPLOYEES API ====================
export const getUsers = (params = {}) =>
  api.get('/employees/users', { params });

export const getUser = (id) =>
  api.get(`/employees/users/${id}`);

export const createUser = (data) =>
  api.post('/employees/users', data);

export const updateUser = (id, data) =>
  api.put(`/employees/users/${id}`, data);

export const deactivateUser = (id) =>
  api.patch(`/employees/users/${id}/deactivate`);

export const getEmployees = (params = {}) =>
  api.get('/employees', { params });

export const getMyTeam = () =>
  api.get('/employees/my-team');

export const getDepartments = () =>
  api.get('/employees/departments');

export const getChefsEquipe = (department) =>
  api.get('/employees/chefs-equipe', { params: { department } });

export const getManagers = () =>
  api.get('/employees/managers');

// ==================== CAMPAIGNS API ====================
export const getCampaigns = (params = {}) =>
  api.get('/campaigns', { params });

export const getActiveCampaigns = () =>
  api.get('/campaigns/active');

export const getCampaign = (id) =>
  api.get(`/campaigns/${id}`);

export const getCampaignStats = (id) =>
  api.get(`/campaigns/${id}/stats`);

export const createCampaign = (data) =>
  api.post('/campaigns', data);

export const updateCampaign = (id, data) =>
  api.put(`/campaigns/${id}`, data);

export const launchCampaign = (id) =>
  api.post(`/campaigns/${id}/launch`);

export const updateCampaignStatus = (id, status) =>
  api.patch(`/campaigns/${id}/status`, { status });

export const deleteCampaign = (id) =>
  api.delete(`/campaigns/${id}`);

// ==================== EVALUATIONS API ====================
// Chef d'équipe
export const getEvaluationsForChefEquipe = (params = {}) =>
  api.get('/evaluations/chef-equipe', { params });

export const submitEvaluation = (id, data) =>
  api.post(`/evaluations/${id}/evaluate`, data);

// Manager
export const getEvaluationsForManager = (params = {}) =>
  api.get('/evaluations/manager', { params });

export const validateByManager = (id, data) =>
  api.post(`/evaluations/${id}/validate-manager`, data);

// RH
export const getEvaluationsForRH = (params = {}) =>
  api.get('/evaluations/rh', { params });

export const validateByRH = (id, data) =>
  api.post(`/evaluations/${id}/validate-rh`, data);

export const makeDecision = (id, data) =>
  api.post(`/evaluations/${id}/decision`, data);

export const notifyEmployee = (id) =>
  api.post(`/evaluations/${id}/notify`);

export const notifyAllEmployees = (campaignId) =>
  api.post(`/evaluations/campaign/${campaignId}/notify-all`);

// Employé
export const getMyEvaluations = () =>
  api.get('/evaluations/my-evaluations');

export const getMyEvaluation = (id) =>
  api.get(`/evaluations/my-evaluations/${id}`);

export const selfEvaluate = (id, data) =>
  api.post(`/evaluations/${id}/self-evaluate`, data);

export const acknowledgeEvaluation = (id, data) =>
  api.post(`/evaluations/${id}/acknowledge`, data);

// Général
export const getEvaluationsByCampaign = (campaignId, params = {}) =>
  api.get(`/evaluations/campaign/${campaignId}`, { params });

export const getEvaluation = (id) =>
  api.get(`/evaluations/${id}`);

// ==================== NOTIFICATIONS API ====================
export const getNotifications = () =>
  api.get('/notifications');

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

// ==================== REPORTS API ====================
export const getCampaignReportPDF = (campaignId) =>
  api.get(`/reports/campaign/${campaignId}/pdf`, { responseType: 'blob' });

export const getCampaignReportData = (campaignId) =>
  api.get(`/reports/campaign/${campaignId}`);

export const getPerformanceReport = (params = {}) =>
  api.get('/reports/performance', { params });

// ==================== LEAVES API ====================
export const createLeave = (data) =>
  api.post('/leaves', data, {
    headers: { 'Content-Type': 'multipart/form-data' } // Browser will add boundary automatically
  });

export const getMyLeaves = () =>
  api.get('/leaves/my-leaves');

export const getManagerLeaves = () =>
  api.get('/leaves/manager');

export const validateLeaveManager = (data) =>
  api.post('/leaves/manager-validate', data);

export const getRHLeaves = () =>
  api.get('/leaves/rh');

export const validateLeaveRH = (data) =>
  api.post('/leaves/rh-validate', data);

export default api;
