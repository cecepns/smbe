import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  AlertTriangle,
  Database,
  BarChart3,
  Settings,
  Users,
  Wrench,
  Package,
  MapPin,
  CreditCard,
  FileText,
  Monitor,
  Clock,
  TrendingUp,
  UserCog
} from 'lucide-react';
import authService from '../services/authService';

const Sidebar = () => {
  const location = useLocation();
  const user = authService.getUser();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'inputer', 'viewer']
    },
    {
      name: 'Data Breakdown',
      href: '/breakdown',
      icon: AlertTriangle,
      roles: ['admin', 'inputer', 'viewer']
    },
    {
      name: 'Spare Parts',
      href: '/spare-parts',
      icon: Package,
      roles: ['admin', 'inputer']
    },
    {
      name: 'Petty Cash',
      href: '/petty-cash',
      icon: CreditCard,
      roles: ['admin', 'inputer']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'inputer', 'viewer']
    },
    {
      name: 'Daily Breakdown Report',
      href: '/reports/daily-breakdown',
      icon: FileText,
      roles: ['admin', 'inputer', 'viewer', 'report_viewer']
    },
    {
      name: 'Unit Downtime',
      href: '/reports/unit-downtime',
      icon: Clock,
      roles: ['admin', 'inputer', 'viewer']
    },
    {
      name: 'Physical Availability',
      href: '/reports/physical-availability',
      icon: TrendingUp,
      roles: ['admin', 'inputer', 'viewer']
    },
    {
      name: 'TV Display Mode',
      href: '/display/daily-breakdown',
      icon: Monitor,
      roles: ['admin', 'report_viewer'] // Only admin and report_viewer can access TV display
    }
  ];

  const masterDataNavigation = [
    {
      name: 'Manajemen User',
      href: '/admin/users',
      icon: UserCog,
      roles: ['admin']
    },
    {
      name: 'Equipment',
      href: '/master/equipment',
      icon: Monitor,
      roles: ['admin']
    },
    {
      name: 'Mekanik',
      href: '/master/mechanics',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Parts',
      href: '/master/parts',
      icon: Wrench,
      roles: ['admin']
    },
    {
      name: 'Lokasi',
      href: '/master/locations',
      icon: MapPin,
      roles: ['admin']
    },
    {
      name: 'Parameter Biaya',
      href: '/master/cost-parameters',
      icon: Settings,
      roles: ['admin']
    }
  ];

  const filterNavigationByRole = (navItems) => {
    return navItems.filter(item => item.roles.includes(user?.role));
  };

  const getLinkClass = (href) => {
    const baseClass = "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200";
    
    // Exact match
    if (location.pathname === href) {
      return `${baseClass} bg-primary-600 text-white shadow-md`;
    }
    
    // Special handling for /reports to avoid matching /reports/* subroutes
    if (href === '/reports') {
      // Only active if exact match, not for subroutes
      const isActive = location.pathname === '/reports';
      return isActive
        ? `${baseClass} bg-primary-600 text-white shadow-md`
        : `${baseClass} text-gray-700 hover:bg-primary-50 hover:text-primary-700`;
    }
    
    // For other routes, check if pathname starts with href (but not exact parent match)
    const isActive = href !== '/dashboard' && 
                     location.pathname.startsWith(href) && 
                     (location.pathname === href || location.pathname.startsWith(href + '/'));
    
    return isActive
      ? `${baseClass} bg-primary-600 text-white shadow-md`
      : `${baseClass} text-gray-700 hover:bg-primary-50 hover:text-primary-700`;
  };

  const getIconClass = (href) => {
    const baseClass = "mr-3 flex-shrink-0 h-5 w-5 transition-colors";
    
    // Exact match
    if (location.pathname === href) {
      return `${baseClass} text-white`;
    }
    
    // Special handling for /reports to avoid matching /reports/* subroutes
    if (href === '/reports') {
      const isActive = location.pathname === '/reports';
      return isActive
        ? `${baseClass} text-white`
        : `${baseClass} text-gray-500 group-hover:text-primary-600`;
    }
    
    // For other routes, check if pathname starts with href (but not exact parent match)
    const isActive = href !== '/dashboard' && 
                     location.pathname.startsWith(href) && 
                     (location.pathname === href || location.pathname.startsWith(href + '/'));
    
    return isActive
      ? `${baseClass} text-white`
      : `${baseClass} text-gray-500 group-hover:text-primary-600`;
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-primary-700">
        <div className="flex items-center space-x-2">
          <Database className="h-8 w-8 text-white" />
          <div className="text-white font-bold text-lg">
            SMBE
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div>
          {filterNavigationByRole(navigation).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={getLinkClass(item.href)}
              >
                <Icon className={getIconClass(item.href)} />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        {/* Master Data Section - Only for Admin */}
        {user?.role === 'admin' && (
          <div className="pt-6">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Master Data
              </h3>
            </div>
            {filterNavigationByRole(masterDataNavigation).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={getLinkClass(item.href)}
                >
                  <Icon className={getIconClass(item.href)} />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;