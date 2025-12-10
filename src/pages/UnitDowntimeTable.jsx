import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import Header from '../components/Header';
import { breakdownAPI, masterAPI } from '../utils/api';
import authService from '../services/authService';

const UnitDowntimeTable = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    location: '',
    status: 'ready' // Only show completed (RFU ready)
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

      // Build params with pagination
      const offset = (currentPage - 1) * limit;
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        status: filters.status,
        limit,
        offset
      };

      // Location filter
      const userLocation = authService.getUserLocation();
      if (userLocation && !filters.location) {
        params.location = userLocation;
      } else if (filters.location) {
        params.location = filters.location;
      }

      const response = await breakdownAPI.getAll(params);
      const data = response.data?.data || response.data || [];
      
      // Set total from response
      if (response.data && response.data.total !== undefined) {
        setTotal(response.data.total);
      } else {
        setTotal(data.length);
      }
      
      // Calculate downtime for each breakdown
      const processedData = data.map(item => {
        const startTime = new Date(item.jam_mulai);
        const endTime = item.jam_selesai ? new Date(item.jam_selesai) : new Date();
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        const durationDays = durationHours / 24;

        return {
          ...item,
          duration_hours: durationHours.toFixed(2),
          duration_days: durationDays.toFixed(2),
          aging_days: item.rfu === 'ready' && item.jam_selesai 
            ? Math.floor((new Date(item.jam_selesai) - startTime) / (1000 * 60 * 60 * 24))
            : Math.floor((new Date() - startTime) / (1000 * 60 * 60 * 24))
        };
      });

      setBreakdowns(processedData);
    } catch (error) {
      console.error('Error loading downtime data:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Durasi Unit Rusak" 
        subtitle="Tabel durasi breakdown unit dari start sampai RFU"
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
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Lokasi</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Status</option>
                <option value="ready">Ready (RFU)</option>
                <option value="in_progress">In Progress</option>
                <option value="breakdown">Breakdown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">NO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">SITE</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[100px]">JOB Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[160px]">CODE UNIT/NO.POL</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">PROBLEM</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[120px]">MODEL UNIT</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">KM/HM</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">LOCATION</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">CUSTOMER</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[200px]">START BD (DATE & TIME)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[130px]">AGING (DAYS)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase whitespace-nowrap min-w-[150px]">DURATION (HOURS)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdowns.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.lokasi || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap min-w-[120px]">{item.kategori_perawatan || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.tanggal)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap min-w-[160px]">{item.equipment_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {item.problem || item.note_plant || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap min-w-[120px]">
                      {equipment.find(eq => eq.equipment_number === item.equipment_number)?.model || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.hm_breakdown || item.km || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.lokasi || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {equipment.find(eq => eq.equipment_number === item.equipment_number)?.customer || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r-2 border-green-200 whitespace-nowrap min-w-[200px]">
                      {formatDateTime(item.jam_mulai)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-green-50 whitespace-nowrap min-w-[130px]">
                      {item.aging_days} hari
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap min-w-[150px]">
                      {item.duration_hours} jam
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {breakdowns.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data downtime</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Menampilkan {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)} dari {total} data
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 border rounded text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {breakdowns.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Breakdown</div>
                <div className="text-2xl font-bold text-blue-600">{breakdowns.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Durasi (Jam)</div>
                <div className="text-2xl font-bold text-green-600">
                  {breakdowns.reduce((sum, item) => sum + parseFloat(item.duration_hours || 0), 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Rata-rata Durasi (Jam)</div>
                <div className="text-2xl font-bold text-orange-600">
                  {(breakdowns.reduce((sum, item) => sum + parseFloat(item.duration_hours || 0), 0) / breakdowns.length).toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Rata-rata Aging (Hari)</div>
                <div className="text-2xl font-bold text-purple-600">
                  {(breakdowns.reduce((sum, item) => sum + parseFloat(item.aging_days || 0), 0) / breakdowns.length).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitDowntimeTable;

