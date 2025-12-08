import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Calendar, MapPin, Download } from 'lucide-react';
import Header from '../components/Header';
import { breakdownAPI, masterAPI } from '../utils/api';
import authService from '../services/authService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const PhysicalAvailability = () => {
  const [paData, setPaData] = useState([]);
  const [summary, setSummary] = useState({});
  const [equipment, setEquipment] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    date_to: new Date().toISOString().split('T')[0], // Today
    location: '',
    group_by: 'daily' // daily, weekly, monthly
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load equipment and locations
      const [equipmentRes, locationsRes] = await Promise.all([
        masterAPI.getEquipment(),
        masterAPI.getLocations()
      ]);
      setEquipment(equipmentRes.data);
      setLocations(locationsRes.data);

      // Build params
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        limit: 10000 // Get all data for calculation
      };

      // Location filter
      const userLocation = authService.getUserLocation();
      if (userLocation && !filters.location) {
        params.location = userLocation;
      } else if (filters.location) {
        params.location = filters.location;
      }

      const response = await breakdownAPI.getAll(params);
      const allBreakdowns = response.data?.data || response.data || [];

      // Calculate PA for each equipment
      const equipmentPA = {};
      const activeHoursPerDay = 24; // Assuming 24 hours active per day

      // Group breakdowns by equipment
      const breakdownsByEquipment = {};
      allBreakdowns.forEach(bd => {
        const eqNum = bd.equipment_number;
        if (!breakdownsByEquipment[eqNum]) {
          breakdownsByEquipment[eqNum] = [];
        }
        breakdownsByEquipment[eqNum].push(bd);
      });

      // Calculate for each equipment
      Object.keys(breakdownsByEquipment).forEach(eqNum => {
        const breakdowns = breakdownsByEquipment[eqNum];
        
        // Calculate total downtime hours
        let totalDowntimeHours = 0;
        breakdowns.forEach(bd => {
          if (bd.jam_mulai) {
            const start = new Date(bd.jam_mulai);
            const end = bd.jam_selesai ? new Date(bd.jam_selesai) : new Date();
            const hours = (end - start) / (1000 * 60 * 60);
            totalDowntimeHours += hours;
          }
        });

        // Calculate date range
        const startDate = new Date(filters.date_from);
        const endDate = new Date(filters.date_to);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalActiveHours = totalDays * activeHoursPerDay;

        // Calculate PA
        const pa = totalActiveHours > 0 
          ? ((totalActiveHours - totalDowntimeHours) / totalActiveHours * 100)
          : 100;

        equipmentPA[eqNum] = {
          equipment_number: eqNum,
          equipment_name: equipmentRes.data.find(eq => eq.equipment_number === eqNum)?.name || eqNum,
          location: breakdowns[0]?.lokasi || '-',
          total_active_hours: totalActiveHours,
          total_downtime_hours: totalDowntimeHours,
          pa: Math.max(0, pa).toFixed(2),
          breakdown_count: breakdowns.length
        };
      });

      // Convert to array and sort by PA
      const paArray = Object.values(equipmentPA).sort((a, b) => parseFloat(a.pa) - parseFloat(b.pa));
      setPaData(paArray);

      // Calculate summary
      if (paArray.length > 0) {
        const totalActiveHours = paArray.reduce((sum, item) => sum + item.total_active_hours, 0);
        const totalDowntimeHours = paArray.reduce((sum, item) => sum + item.total_downtime_hours, 0);
        const avgPA = paArray.reduce((sum, item) => sum + parseFloat(item.pa), 0) / paArray.length;
        const totalBreakdowns = paArray.reduce((sum, item) => sum + item.breakdown_count, 0);

        setSummary({
          total_equipment: paArray.length,
          total_active_hours: totalActiveHours,
          total_downtime_hours: totalDowntimeHours,
          average_pa: avgPA.toFixed(2),
          total_breakdowns: totalBreakdowns
        });
      } else {
        setSummary({
          total_equipment: 0,
          total_active_hours: 0,
          total_downtime_hours: 0,
          average_pa: 100,
          total_breakdowns: 0
        });
      }

      // Group by date for chart
      // TODO: Implement grouping by date/period

    } catch (error) {
      console.error('Error loading PA data:', error);
      alert('Gagal memuat data PA');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPAColor = (pa) => {
    const paValue = parseFloat(pa);
    if (paValue >= 95) return 'text-green-600 bg-green-50';
    if (paValue >= 85) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        title="Physical Availability (PA)" 
        subtitle="Performance Physical Availability per equipment"
      />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Lokasi</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={filters.group_by}
                onChange={(e) => setFilters({ ...filters, group_by: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_equipment || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Active Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_active_hours ? summary.total_active_hours.toFixed(0) : 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Downtime Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_downtime_hours ? summary.total_downtime_hours.toFixed(2) : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average PA</p>
                <p className="text-2xl font-bold text-green-600">{summary.average_pa || '100.00'}%</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* PA Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Physical Availability per Equipment</h3>
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downtime Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakdown Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PA (%)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paData.map((item) => (
                  <tr key={item.equipment_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.equipment_number}</div>
                      <div className="text-xs text-gray-500">{item.equipment_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.total_active_hours.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.total_downtime_hours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.breakdown_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPAColor(item.pa)}`}>
                        {item.pa}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paData.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data PA</p>
              </div>
            )}
          </div>
        </div>

        {/* PA Chart */}
        {paData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PA Chart</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={paData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipment_number" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="pa" fill="#3B82F6" name="PA (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalAvailability;

