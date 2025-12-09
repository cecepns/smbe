import { useState, useEffect } from 'react';
import { Download, BarChart3, FileText, TrendingUp, DollarSign, Package, Users, Clock, Monitor } from 'lucide-react';
import Header from '../components/Header';
import { breakdownAPI, masterAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('equipment');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    date_to: new Date().toISOString().split('T')[0], // Today
    customer: '',
    location: '',
    equipment: ''
  });

  const [sparePartsData, setSparePartsData] = useState([]);
  const [costAnalysisData, setCostAnalysisData] = useState([]);
  const [mechanicUtilizationData, setMechanicUtilizationData] = useState([]);
  const [equipmentPerformanceData, setEquipmentPerformanceData] = useState([]);
  const [dailyBreakdownSummary, setDailyBreakdownSummary] = useState([]);
  const [unitDurationSummary, setUnitDurationSummary] = useState([]);
  const [paSummary, setPaSummary] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadMasterData();
    loadReportData();
  }, [activeTab, filters]);

  const loadMasterData = async () => {
    try {
      const [locationsRes, equipmentRes] = await Promise.all([
        masterAPI.getLocations(),
        masterAPI.getEquipment()
      ]);
      setLocations(locationsRes.data || []);
      // Extract unique customers from equipment
      const uniqueCustomers = [...new Set((equipmentRes.data || [])
        .map(eq => eq.customer)
        .filter(c => c))];
      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        customer: filters.customer,
        location: filters.location,
        equipment: filters.equipment,
        limit: 1000
      };

      // Mock data - replace with actual API calls
      switch (activeTab) {
        case 'equipment':
          // Load equipment performance data
          try {
            const response = await breakdownAPI.getAll(params);
            const breakdowns = response.data?.data || [];
            
            // Calculate performance per equipment
            const perfMap = {};
            breakdowns.forEach(bd => {
              const key = bd.equipment_number;
              if (!perfMap[key]) {
                perfMap[key] = { equipment: key, breakdowns: 0, downtime: 0, customer: bd.customer };
              }
              perfMap[key].breakdowns++;
              if (bd.jam_mulai) {
                const start = new Date(bd.jam_mulai);
                const end = bd.jam_selesai ? new Date(bd.jam_selesai) : new Date();
                perfMap[key].downtime += (end - start) / (1000 * 60 * 60);
              }
            });
            
            const perfArray = Object.values(perfMap).map(item => ({
              ...item,
              downtime: item.downtime.toFixed(2),
              availability: (100 - (item.downtime / 720 * 100)).toFixed(2) // 720 hours per month
            }));
            
            setEquipmentPerformanceData(perfArray);
          } catch (error) {
            console.error('Error loading equipment performance:', error);
          }
          break;
          
        case 'daily-breakdown-summary':
          // Load daily breakdown summary by customer
          try {
            const response = await breakdownAPI.getAll(params);
            const breakdowns = response.data?.data || [];
            
            const customerMap = {};
            breakdowns.forEach(bd => {
              const customer = bd.customer || 'Unknown';
              if (!customerMap[customer]) {
                customerMap[customer] = { customer, count: 0, units: new Set() };
              }
              customerMap[customer].count++;
              customerMap[customer].units.add(bd.equipment_number);
            });
            
            const summaryArray = Object.values(customerMap).map(item => ({
              customer: item.customer,
              breakdown_count: item.count,
              unit_count: item.units.size
            }));
            
            setDailyBreakdownSummary(summaryArray);
          } catch (error) {
            console.error('Error loading daily breakdown summary:', error);
          }
          break;
          
        case 'unit-duration-summary':
          // Load unit duration summary by customer
          try {
            const response = await breakdownAPI.getAll(params);
            const breakdowns = response.data?.data || [];
            
            const customerMap = {};
            breakdowns.forEach(bd => {
              const customer = bd.customer || 'Unknown';
              if (!customerMap[customer]) {
                customerMap[customer] = { customer, total_duration: 0, count: 0 };
              }
              if (bd.jam_mulai) {
                const start = new Date(bd.jam_mulai);
                const end = bd.jam_selesai ? new Date(bd.jam_selesai) : new Date();
                const hours = (end - start) / (1000 * 60 * 60);
                customerMap[customer].total_duration += hours;
                customerMap[customer].count++;
              }
            });
            
            const summaryArray = Object.values(customerMap).map(item => ({
              customer: item.customer,
              total_duration: item.total_duration.toFixed(2),
              avg_duration: (item.total_duration / item.count).toFixed(2),
              count: item.count
            }));
            
            setUnitDurationSummary(summaryArray);
          } catch (error) {
            console.error('Error loading unit duration summary:', error);
          }
          break;
          
        case 'pa-summary':
          // Load PA summary by customer
          try {
            const response = await breakdownAPI.getAll(params);
            const breakdowns = response.data?.data || [];
            
            const customerMap = {};
            breakdowns.forEach(bd => {
              const customer = bd.customer || 'Unknown';
              if (!customerMap[customer]) {
                customerMap[customer] = { customer, total_downtime: 0, unit_count: new Set() };
              }
              customerMap[customer].unit_count.add(bd.equipment_number);
              if (bd.jam_mulai) {
                const start = new Date(bd.jam_mulai);
                const end = bd.jam_selesai ? new Date(bd.jam_selesai) : new Date();
                customerMap[customer].total_downtime += (end - start) / (1000 * 60 * 60);
              }
            });
            
            const startDate = new Date(filters.date_from);
            const endDate = new Date(filters.date_to);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            const summaryArray = Object.values(customerMap).map(item => {
              const totalActiveHours = item.unit_count.size * totalDays * 24;
              const pa = totalActiveHours > 0 
                ? ((totalActiveHours - item.total_downtime) / totalActiveHours * 100)
                : 100;
              return {
                customer: item.customer,
                unit_count: item.unit_count.size,
                total_downtime: item.total_downtime.toFixed(2),
                pa: Math.max(0, pa).toFixed(2)
              };
            });
            
            setPaSummary(summaryArray);
          } catch (error) {
            console.error('Error loading PA summary:', error);
          }
          break;
          
        case 'spare-parts':
          setSparePartsData([
            { part: 'Oil Filter', used: 45, cost: 4500000 },
            { part: 'Brake Pad', used: 32, cost: 3200000 },
            { part: 'Battery', used: 18, cost: 5400000 },
            { part: 'Tire', used: 12, cost: 4800000 },
            { part: 'Engine Oil', used: 120, cost: 3600000 }
          ]);
          break;
          
        case 'cost-analysis':
          setCostAnalysisData([
            { month: 'Jan', spare_parts: 15000000, labor: 25000000, transport: 8000000, total: 48000000 },
            { month: 'Feb', spare_parts: 18000000, labor: 28000000, transport: 9500000, total: 55500000 },
            { month: 'Mar', spare_parts: 12000000, labor: 22000000, transport: 7000000, total: 41000000 },
            { month: 'Apr', spare_parts: 20000000, labor: 30000000, transport: 10000000, total: 60000000 },
            { month: 'May', spare_parts: 16000000, labor: 26000000, transport: 8500000, total: 50500000 },
            { month: 'Jun', spare_parts: 14000000, labor: 24000000, transport: 7500000, total: 45500000 }
          ]);
          break;
          
        case 'mechanic':
          setMechanicUtilizationData([
            { name: 'Budi Santoso', hours: 168, jobs: 12, efficiency: 85 },
            { name: 'Sari Wijaya', hours: 156, jobs: 10, efficiency: 78 },
            { name: 'Ahmad Rahman', hours: 172, jobs: 14, efficiency: 89 },
            { name: 'Dewi Sari', hours: 148, jobs: 9, efficiency: 74 },
            { name: 'Rudi Hartono', hours: 162, jobs: 11, efficiency: 81 }
          ]);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      // Implement export functionality
      alert(`Export ${activeTab} report as ${format} - Coming soon`);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Gagal mengexport laporan');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const tabs = [
    { id: 'equipment', name: 'Performance Equipment', icon: TrendingUp },
    { id: 'daily-breakdown-summary', name: 'Daily Breakdown (Summary)', icon: BarChart3 },
    { id: 'unit-duration-summary', name: 'Durasi Unit (Summary)', icon: Clock },
    { id: 'pa-summary', name: 'PA (Summary)', icon: TrendingUp },
    { id: 'mechanic', name: 'Utilisasi Mekanik', icon: Users },
    { id: 'spare-parts', name: 'Penggunaan Spare Parts', icon: Package },
    { id: 'cost-analysis', name: 'Analisis Biaya', icon: DollarSign },
    { id: 'daily-breakdown', name: 'Daily Breakdown (Detail)', icon: FileText, route: '/reports/daily-breakdown' },
    { id: 'unit-downtime', name: 'Unit Downtime (Detail)', icon: Clock, route: '/reports/unit-downtime' },
    { id: 'pa', name: 'Physical Availability (Detail)', icon: TrendingUp, route: '/reports/physical-availability' },
    { id: 'display', name: 'TV Display Mode', icon: Monitor, route: '/display/daily-breakdown' }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Reports & Analytics" 
        subtitle="Laporan dan analisis data breakdown equipment"
      />
      
      <div className="p-4">
        {/* Filters */}
        <div className="mb-3 bg-white rounded-lg shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                value={filters.customer || ''}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Customer</option>
                {customers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <select
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Lokasi</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Equipment
              </label>
              <input
                type="text"
                value={filters.equipment}
                onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}
                placeholder="Semua Equipment"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3 bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                // If tab has route, navigate instead of changing tab
                if (tab.route) {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.route)}
                      className="flex items-center space-x-1 px-4 py-2 text-xs font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Spare Parts Usage Report */}
            {activeTab === 'spare-parts' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Laporan Penggunaan Spare Parts
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sparePartsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="part" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => 
                      name === 'cost' ? formatCurrency(value) : value
                    } />
                    <Bar yAxisId="left" dataKey="used" fill="#3B82F6" name="Jumlah Terpakai" />
                    <Bar yAxisId="right" dataKey="cost" fill="#10B981" name="Total Biaya" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Terpakai</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sparePartsData.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.part}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.used}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Analysis Report */}
            {activeTab === 'cost-analysis' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Analisis Biaya per Bulan
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={costAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="spare_parts" stackId="a" fill="#3B82F6" name="Spare Parts" />
                    <Bar dataKey="labor" stackId="a" fill="#10B981" name="Labor" />
                    <Bar dataKey="transport" stackId="a" fill="#F59E0B" name="Transport" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mechanic Utilization Report */}
            {activeTab === 'mechanic' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Utilisasi Mekanik
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mechanicUtilizationData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#3B82F6" name="Efisiensi (%)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Job</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efisiensi (%)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mechanicUtilizationData.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.hours}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.jobs}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.efficiency}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Equipment Performance Report */}
            {activeTab === 'equipment' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Performance Equipment
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={equipmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="equipment" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="breakdowns" stroke="#EF4444" name="Breakdowns" />
                    <Line type="monotone" dataKey="availability" stroke="#10B981" name="Availability (%)" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakdowns</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downtime (jam)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability (%)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {equipmentPerformanceData.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.equipment}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.customer || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.breakdowns}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.downtime}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.availability}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily Breakdown Summary by Customer */}
            {activeTab === 'daily-breakdown-summary' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Daily Breakdown Summary (Total per Customer)
                </h3>
                <p className="text-sm text-gray-600 mb-4">Detail breakdown ada di sub modul Daily Breakdown (Detail)</p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dailyBreakdownSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="breakdown_count" fill="#EF4444" name="Jumlah Breakdown" />
                    <Bar dataKey="unit_count" fill="#3B82F6" name="Jumlah Unit" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Breakdown</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Unit Terdampak</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyBreakdownSummary.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customer}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.breakdown_count}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.unit_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unit Duration Summary by Customer */}
            {activeTab === 'unit-duration-summary' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Durasi Unit Summary (Total per Customer)
                </h3>
                <p className="text-sm text-gray-600 mb-4">Detail durasi ada di sub modul Unit Downtime (Detail)</p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={unitDurationSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} jam`} />
                    <Bar dataKey="total_duration" fill="#F59E0B" name="Total Durasi (jam)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Durasi (jam)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rata-rata Durasi (jam)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unitDurationSummary.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customer}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.total_duration}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.avg_duration}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PA Summary by Customer */}
            {activeTab === 'pa-summary' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Physical Availability Summary (Total per Customer)
                </h3>
                <p className="text-sm text-gray-600 mb-4">Detail PA per unit ada di sub modul Physical Availability (Detail)</p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={paSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => name === 'pa' ? `${value}%` : value} />
                    <Bar dataKey="pa" fill="#10B981" name="PA (%)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Downtime (jam)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PA (%)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paSummary.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customer}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.unit_count}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.total_downtime}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              parseFloat(item.pa) >= 95 ? 'bg-green-100 text-green-700' :
                              parseFloat(item.pa) >= 85 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.pa}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

