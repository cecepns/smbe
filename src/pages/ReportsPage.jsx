import React, { useState, useEffect } from 'react';
import { Download, BarChart3, FileText, TrendingUp, DollarSign, Package, Users, Clock, Monitor } from 'lucide-react';
import Header from '../components/Header';
import { reportsAPI, masterAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('spare-parts');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    customer: '',
    location: '',
    equipment: ''
  });

  const [sparePartsData, setSparePartsData] = useState([]);
  const [costAnalysisData, setCostAnalysisData] = useState([]);
  const [mechanicUtilizationData, setMechanicUtilizationData] = useState([]);
  const [equipmentPerformanceData, setEquipmentPerformanceData] = useState([]);
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
      
      // Mock data - replace with actual API calls
      switch (activeTab) {
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
        case 'equipment':
          setEquipmentPerformanceData([
            { equipment: 'EX-001', breakdowns: 3, downtime: 24, availability: 92 },
            { equipment: 'EX-002', breakdowns: 2, downtime: 16, availability: 94 },
            { equipment: 'EX-003', breakdowns: 5, downtime: 40, availability: 88 },
            { equipment: 'EX-004', breakdowns: 1, downtime: 8, availability: 97 },
            { equipment: 'EX-005', breakdowns: 4, downtime: 32, availability: 90 }
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
    { id: 'spare-parts', name: 'Penggunaan Spare Parts', icon: Package },
    { id: 'cost-analysis', name: 'Analisis Biaya', icon: DollarSign },
    { id: 'mechanic', name: 'Utilisasi Mekanik', icon: Users },
    { id: 'equipment', name: 'Performance Equipment', icon: TrendingUp },
    { id: 'daily-breakdown', name: 'Daily Breakdown', icon: FileText, route: '/reports/daily-breakdown' },
    { id: 'unit-downtime', name: 'Durasi Unit Rusak', icon: Clock, route: '/reports/unit-downtime' },
    { id: 'pa', name: 'Physical Availability', icon: TrendingUp, route: '/reports/physical-availability' },
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakdowns</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downtime (jam)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability (%)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {equipmentPerformanceData.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.equipment}</td>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

