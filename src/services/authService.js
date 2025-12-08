import { authAPI } from '../utils/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(email, password) {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.token = token;
      this.user = user;
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  }

  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getUserRole() {
    return this.user?.role || null;
  }

  hasPermission(permission) {
    if (!this.user) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage'],
      inputer: ['read', 'write'],
      viewer: ['read'],
      report_viewer: ['read'] // Only can view daily breakdown report
    };
    
    const userPermissions = rolePermissions[this.user.role] || [];
    return userPermissions.includes(permission);
  }

  canAccessAdminFeatures() {
    return this.user?.role === 'admin';
  }

  canInputData() {
    return ['admin', 'inputer'].includes(this.user?.role);
  }

  canViewData() {
    return ['admin', 'inputer', 'viewer', 'report_viewer'].includes(this.user?.role);
  }

  canViewReports() {
    return ['admin', 'inputer', 'viewer', 'report_viewer'].includes(this.user?.role);
  }

  canViewOnlyDailyReport() {
    return this.user?.role === 'report_viewer';
  }

  getUserLocation() {
    return this.user?.location || null;
  }

  hasLocationAccess(location) {
    if (!this.user) return false;
    // Admin can access all locations
    if (this.user.role === 'admin') return true;
    // Other users can only access their assigned location
    return this.user.location === location;
  }
}

export default new AuthService();