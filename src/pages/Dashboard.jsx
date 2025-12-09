import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Wrench,
  BarChart3,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '../components/Header';
import authService from '../services/authService';
import { dashboardAPI } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    equipmentBroken: 0,
    equipmentReady: 0,
    totalMechanics: 0,
    totalCost: 0,
    averageRepairTime: 0
  });

  const [breakdownTrends, setBreakdownTrends] = useState([]);
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [mechanicUtilization, setMechanicUtilization] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch all dashboard data in parallel
      const [statsResponse, trendsResponse, statusResponse, utilizationResponse, costResponse, activitiesResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getBreakdownTrends(),
        dashboardAPI.getEquipmentStatus(),
        dashboardAPI.getMechanicUtilization(),
        dashboardAPI.getCostAnalysis(),
        dashboardAPI.getRecentActivities({ limit: 10 })
      ]);

      // Set stats
      setStats(statsResponse.data);

      // Set breakdown trends
      setBreakdownTrends(trendsResponse.data);

      // Set equipment status
      setEquipmentStatus(statusResponse.data);

      // Set mechanic utilization
      setMechanicUtilization(utilizationResponse.data);

      // Set cost analysis
      setCostAnalysis(costResponse.data);

      // Set recent activities
      setRecentActivities(activitiesResponse.data);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default/empty data on error
      setStats({
        totalEquipment: 0,
        equipmentBroken: 0,
        equipmentReady: 0,
        totalMechanics: 0,
        totalCost: 0,
        averageRepairTime: 0,
        activeMechanics: 0,
        changes: {}
      });
      setBreakdownTrends([]);
      setEquipmentStatus([]);
      setMechanicUtilization([]);
      setCostAnalysis([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Auto-refresh effect
  useEffect(() => {
    // Initial load
    loadDashboardData();

    // Set up auto-refresh interval (5 minutes = 300000ms)
    let intervalId;
    if (autoRefreshEnabled) {
      intervalId = setInterval(() => {
        loadDashboardData(true);
      }, 300000);
    }

    // Cleanup interval on unmount or when auto-refresh is disabled
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loadDashboardData, autoRefreshEnabled]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatRelativeTime = (dateTime) => {
    if (!dateTime) return 'Belum diperbarui';

    const now = new Date();
    const updateTime = new Date(dateTime);
    const diffMs = now - updateTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja diperbarui';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return '1 hari yang lalu';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return updateTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle, hide }) => { // eslint-disable-line react/prop-types
    // Hide Total Mekanik and Total Biaya for viewer role
    const userRole = authService.getUserRole();
    if (hide && userRole === 'viewer') {
      return null;
    }
    
    // Format change percentage
    const formatChange = (changeValue) => {
      if (changeValue === null || changeValue === undefined) return null;
      const sign = changeValue >= 0 ? '+' : '';
      return `${sign}${changeValue.toFixed(1)}%`;
    };

    const changeText = change !== null && change !== undefined ? formatChange(change) : null;
    const isPositiveChange = change !== null && change !== undefined && change >= 0;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {changeText && (
          <div className="mt-2 flex items-center">
            <TrendingUp className={`h-3 w-3 mr-1 ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {changeText}
            </span>
            <span className="text-xs text-gray-500 ml-1">vs bulan lalu</span>
          </div>
        )}
      </div>
    );
  };


  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );

  const SkeletonChart = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <Header
          title="Dashboard"
          subtitle="Monitoring performance equipment dan maintenance overview"
        />

        {/* Dashboard Controls Skeleton */}
        <div className="px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stats Overview Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

          {/* Charts Row 1 Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SkeletonChart />
            <SkeletonChart />
          </div>

          {/* Charts Row 2 Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SkeletonChart />
            <SkeletonChart />
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Recent Activities Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Dashboard"
        subtitle="Monitoring performance equipment dan maintenance overview"
      />

      {/* Dashboard Controls */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui'}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  autoRefreshEnabled
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {autoRefreshEnabled ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>Auto-refresh {autoRefreshEnabled ? 'Aktif' : 'Nonaktif'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-500">
            {isRefreshing && (
              <div className="flex items-center space-x-1 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="text-xs">Memperbarui...</span>
              </div>
            )}
            <span>Terakhir diperbarui:</span>
            <span className={`font-medium ${isRefreshing ? 'text-blue-600' : 'text-gray-700'}`}>
              {formatRelativeTime(lastUpdated)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            title="Total Equipment"
            value={stats.totalEquipment}
            icon={Activity}
            color="bg-blue-500"
            change={stats.changes?.totalEquipment}
          />
          
          <StatCard
            title="Equipment Rusak"
            value={stats.equipmentBroken}
            icon={AlertTriangle}
            color="bg-red-500"
            change={stats.changes?.equipmentBroken}
          />
          
          <StatCard
            title="Equipment Ready"
            value={stats.equipmentReady}
            icon={CheckCircle}
            color="bg-green-500"
            change={stats.changes?.equipmentReady}
          />
          
          <StatCard
            title="Total Mekanik"
            value={stats.totalMechanics}
            icon={Users}
            color="bg-purple-500"
            subtitle={stats.activeMechanics ? `${stats.activeMechanics} Active` : undefined}
            hide={true}
          />
          
          <StatCard
            title="Total Biaya"
            value={formatCurrency(stats.totalCost)}
            icon={DollarSign}
            color="bg-yellow-500"
            change={stats.changes?.totalCost}
            hide={true}
          />
          
          <StatCard
            title="Avg Repair Time"
            value={`${stats.averageRepairTime}h`}
            icon={Clock}
            color="bg-indigo-500"
            subtitle="Per breakdown"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Breakdown Trends */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Trend Breakdown & Perbaikan
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={breakdownTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="breakdowns" fill="#EF4444" name="Breakdowns" />
                <Bar dataKey="repairs" fill="#10B981" name="Repairs" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Equipment Status */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Status Equipment
            </h3>
            <div className="flex items-center justify-center h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {equipmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Mechanic Utilization */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Utilisasi Mekanik (%)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mechanicUtilization} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Analisis Biaya
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <button className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-red-900">Report Breakdown</div>
                <div className="text-xs text-red-600">Laporkan kerusakan baru</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-green-900">Mark as Ready</div>
                <div className="text-xs text-green-600">Tandai equipment siap</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Wrench className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-blue-900">Assign Mechanic</div>
                <div className="text-xs text-blue-600">Tugaskan mekanik</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-purple-900">View Reports</div>
                <div className="text-xs text-purple-600">Lihat laporan detail</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Aktivitas Terbaru
          </h3>
          <div className="space-y-2">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.status === 'red' ? 'bg-red-500' :
                    activity.status === 'green' ? 'bg-green-500' :
                    activity.status === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Tidak ada aktivitas terbaru</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;