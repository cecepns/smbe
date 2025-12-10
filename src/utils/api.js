import axios from 'axios';

const API_BASE_URL = 'https://api-inventory.isavralabel.com/smbe/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Breakdown endpoints
export const breakdownAPI = {
  getAll: (params) => api.get('/breakdown', { params }),
  getById: (id) => api.get(`/breakdown/${id}`),
  create: (data) => api.post('/breakdown', data),
  update: (id, data) => api.put(`/breakdown/${id}`, data),
  delete: (id) => api.delete(`/breakdown/${id}`),
  exportExcel: (params) => api.get('/breakdown/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/breakdown/export/pdf', { params, responseType: 'blob' }),
};

// Master data endpoints
export const masterAPI = {
  // Equipment
  getEquipment: () => api.get('/master/equipment'),
  createEquipment: (data) => api.post('/master/equipment', data),
  updateEquipment: (id, data) => api.put(`/master/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/master/equipment/${id}`),
  
  // Mechanic
  getMechanics: () => api.get('/master/mechanics'),
  createMechanic: (data) => api.post('/master/mechanics', data),
  updateMechanic: (id, data) => api.put(`/master/mechanics/${id}`, data),
  deleteMechanic: (id) => api.delete(`/master/mechanics/${id}`),
  
  // Parts
  getParts: () => api.get('/master/parts'),
  createPart: (data) => api.post('/master/parts', data),
  updatePart: (id, data) => api.put(`/master/parts/${id}`, data),
  deletePart: (id) => api.delete(`/master/parts/${id}`),
  
  // Locations
  getLocations: () => api.get('/master/locations'),
  createLocation: (data) => api.post('/master/locations', data),
  updateLocation: (id, data) => api.put(`/master/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/master/locations/${id}`),
  
  // Cost Parameters
  getCostParameters: () => api.get('/master/cost-parameters'),
  updateCostParameters: (data) => api.put('/master/cost-parameters', data),
  
  // Equipment Master Data
  getEquipmentTypes: () => api.get('/master/equipment-types'),
  createEquipmentType: (data) => api.post('/master/equipment-types', data),
  getEquipmentBrands: () => api.get('/master/equipment-brands'),
  createEquipmentBrand: (data) => api.post('/master/equipment-brands', data),
  getEquipmentCategories: () => api.get('/master/equipment-categories'),
  createEquipmentCategory: (data) => api.post('/master/equipment-categories', data),
  getEquipmentModels: () => api.get('/master/equipment-models'),
  createEquipmentModel: (data) => api.post('/master/equipment-models', data),
  getCustomers: () => api.get('/master/customers'),
  createCustomer: (data) => api.post('/master/customers', data),
  updateCustomer: (id, data) => api.put(`/master/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/master/customers/${id}`),
  
  // Mechanic Master Data
  getSpecializations: () => api.get('/master/specializations'),
  createSpecialization: (data) => api.post('/master/specializations', data),
  
  // Part Master Data
  getPartCategories: () => api.get('/master/part-categories'),
  createPartCategory: (data) => api.post('/master/part-categories', data),
  getPartUnits: () => api.get('/master/part-units'),
  createPartUnit: (data) => api.post('/master/part-units', data),
  getPartBrands: () => api.get('/master/part-brands'),
  createPartBrand: (data) => api.post('/master/part-brands', data),
};

// Spare parts endpoints
export const sparePartsAPI = {
  getTransactions: (params) => api.get('/spare-parts', { params }),
  createTransaction: (data) => api.post('/spare-parts', data),
  updateTransaction: (id, data) => api.put(`/spare-parts/${id}`, data),
  deleteTransaction: (id) => api.delete(`/spare-parts/${id}`),
};

// Petty cash endpoints
export const pettyCashAPI = {
  getTransactions: (params) => api.get('/petty-cash', { params }),
  createTransaction: (data) => api.post('/petty-cash', data),
  updateTransaction: (id, data) => api.put(`/petty-cash/${id}`, data),
  deleteTransaction: (id) => api.delete(`/petty-cash/${id}`),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getPerformance: () => api.get('/dashboard/performance'),
  getBreakdownTrends: () => api.get('/dashboard/breakdown-trends'),
  getMechanicUtilization: () => api.get('/dashboard/mechanic-utilization'),
  getEquipmentStatus: () => api.get('/dashboard/equipment-status'),
  getCostAnalysis: () => api.get('/dashboard/cost-analysis'),
  getRecentActivities: (params) => api.get('/dashboard/recent-activities', { params }),
};

// Reports endpoints
export const reportsAPI = {
  getSparePartsUsage: (params) => api.get('/reports/spare-parts-usage', { params }),
  getCostAnalysis: (params) => api.get('/reports/cost-analysis', { params }),
  getMechanicUtilization: (params) => api.get('/reports/mechanic-utilization', { params }),
  getEquipmentPerformance: (params) => api.get('/reports/equipment-performance', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

// User management endpoints (Admin only)
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;