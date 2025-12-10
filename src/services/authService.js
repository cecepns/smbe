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

  getUserPosition() {
    return this.user?.position || null;
  }

  hasPermission(permission) {
    if (!this.user) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage', 'petty_cash'],
      inputer: ['read', 'write'], // No petty_cash access
      viewer: ['read', 'petty_cash'],
      report_viewer: ['read'] // Only can view daily breakdown report
    };
    
    const userPermissions = rolePermissions[this.user.role] || [];
    return userPermissions.includes(permission);
  }

  canAccessPettyCash() {
    return this.hasPermission('petty_cash');
  }

  canAccessAdminFeatures() {
    return this.user?.role === 'admin';
  }

  canInputData() {
    // Only admin can input breakdown, spare parts data
    // Inputer role is now view-only for reports
    return ['admin', 'inputer'].includes(this.user?.role);
  }

  canViewData() {
    return ['admin', 'inputer', 'viewer', 'report_viewer'].includes(this.user?.role);
  }

  canViewReports() {
    // Inputer can view reports but only for their location
    return ['admin', 'inputer', 'viewer', 'report_viewer'].includes(this.user?.role);
  }

  canEditReports() {
    // Only admin can edit, inputer is view-only
    return this.user?.role === 'admin';
  }

  canViewOnlyDailyReport() {
    return this.user?.role === 'report_viewer';
  }

  isInputerRole() {
    return this.user?.role === 'inputer';
  }

  // Inputer can only view: reports, daily bd, unit downtime, PA for their site
  getInputerAllowedPages() {
    if (this.user?.role !== 'inputer') return [];
    return ['reports', 'daily-breakdown', 'unit-downtime', 'physical-availability'];
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