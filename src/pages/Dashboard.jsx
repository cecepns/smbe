import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  Wrench,
  BarChart3,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '../components/Header';
import authService from '../services/authService';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      setStats({
        totalEquipment: 48,
        equipmentBroken: 5,
        equipmentReady: 43,
        totalMechanics: 12,
        totalCost: 125000000,
        averageRepairTime: 4.5
      });

      setBreakdownTrends([
        { month: 'Jan', breakdowns: 12, repairs: 11 },
        { month: 'Feb', breakdowns: 15, repairs: 14 },
        { month: 'Mar', breakdowns: 8, repairs: 9 },
        { month: 'Apr', breakdowns: 18, repairs: 16 },
        { month: 'May', breakdowns: 22, repairs: 20 },
        { month: 'Jun', breakdowns: 13, repairs: 15 }
      ]);

      setEquipmentStatus([
        { name: 'Ready', value: 43, color: '#10B981' },
        { name: 'Breakdown', value: 5, color: '#EF4444' },
        { name: 'Maintenance', value: 3, color: '#F59E0B' }
      ]);

      setMechanicUtilization([
        { name: 'Budi', hours: 168, utilization: 85 },
        { name: 'Sari', hours: 156, utilization: 78 },
        { name: 'Ahmad', hours: 172, utilization: 89 },
        { name: 'Dewi', hours: 148, utilization: 74 },
        { name: 'Rudi', hours: 162, utilization: 81 }
      ]);

      setCostAnalysis([
        { category: 'Spare Parts', amount: 65000000 },
        { category: 'Labor', amount: 35000000 },
        { category: 'Transport', amount: 15000000 },
        { category: 'Others', amount: 10000000 }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle, hide }) => { // eslint-disable-line react/prop-types
    // Hide Total Mekanik and Total Biaya for viewer role
    const userRole = authService.getUserRole();
    if (hide && userRole === 'viewer') {
      return null;
    }
    
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
        {change && (
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs font-medium text-green-600">{change}</span>
            <span className="text-xs text-gray-500 ml-1">vs bulan lalu</span>
          </div>
        )}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Dashboard" 
        subtitle="Monitoring performance equipment dan maintenance overview"
      />
      
      <div className="p-4 space-y-3">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            title="Total Equipment"
            value={stats.totalEquipment}
            icon={Activity}
            color="bg-blue-500"
            change="+5.2%"
          />
          
          <StatCard
            title="Equipment Rusak"
            value={stats.equipmentBroken}
            icon={AlertTriangle}
            color="bg-red-500"
            change="-12.5%"
          />
          
          <StatCard
            title="Equipment Ready"
            value={stats.equipmentReady}
            icon={CheckCircle}
            color="bg-green-500"
            change="+8.3%"
          />
          
          <StatCard
            title="Total Mekanik"
            value={stats.totalMechanics}
            icon={Users}
            color="bg-purple-500"
            subtitle="12 Active"
            hide={true}
          />
          
          <StatCard
            title="Total Biaya"
            value={formatCurrency(stats.totalCost)}
            icon={DollarSign}
            color="bg-yellow-500"
            change="-3.2%"
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
            {[
              { type: 'breakdown', message: 'Equipment EX-001 mengalami breakdown', time: '2 menit yang lalu', status: 'red' },
              { type: 'repair', message: 'Perbaikan EX-005 telah selesai', time: '15 menit yang lalu', status: 'green' },
              { type: 'maintenance', message: 'Scheduled maintenance EX-003 dimulai', time: '1 jam yang lalu', status: 'yellow' },
              { type: 'part', message: 'Spare part untuk EX-007 telah tersedia', time: '2 jam yang lalu', status: 'blue' },
            ].map((activity, index) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;