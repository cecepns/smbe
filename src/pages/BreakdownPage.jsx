import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, FileEdit as Edit, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import BreakdownForm from '../components/BreakdownForm';
import { breakdownAPI } from '../utils/api';
import authService from '../services/authService';

const BreakdownPage = ({ isNew }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(isNew || false);
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    equipment: '',
    location: '',
    date_from: '',
    date_to: ''
  });

  const canInputData = authService.canInputData();
  const canViewData = authService.canViewData();

  const loadBreakdowns = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const params = {
        limit,
        offset,
        ...filters
      };

      // Add search term as equipment filter if provided
      if (searchTerm) {
        params.equipment = searchTerm;
      }

      // Location-based filtering - user can only see their location data
      const userLocation = authService.getUserLocation();
      if (userLocation && authService.getUserRole() !== 'admin') {
        params.location = userLocation;
      }

      const response = await breakdownAPI.getAll(params);
      
      // Handle both old format (array) and new format (object with data and total)
      if (response.data && response.data.data) {
        // New format with pagination info
        setBreakdowns(response.data.data);
        setTotal(response.data.total || 0);
      } else if (Array.isArray(response.data)) {
        // Old format (array) - backward compatibility
        setBreakdowns(response.data);
        // If we get less than limit, we're on last page
        if (response.data.length < limit) {
          setTotal((currentPage - 1) * limit + response.data.length);
        } else {
          // If we got full page, assume there might be more
          setTotal(currentPage * limit + 1);
        }
      } else {
        setBreakdowns([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading breakdowns:', error);
      alert('Gagal memuat data breakdown');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filters, searchTerm]);

  useEffect(() => {
    if (id && !isNew) {
      setShowForm(true);
      setSelectedBreakdown(id);
    } else {
      loadBreakdowns();
    }
  }, [id, isNew, loadBreakdowns]);

  // Debounce search - reset to page 1 when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleNewBreakdown = () => {
    setSelectedBreakdown(null);
    setShowForm(true);
  };

  const handleEditBreakdown = (breakdownId) => {
    setSelectedBreakdown(breakdownId);
    setShowForm(true);
  };

  const handleViewBreakdown = (breakdownId) => {
    navigate(`/breakdown/${breakdownId}`);
  };

  const handleDeleteBreakdown = async (breakdownId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data breakdown ini?')) {
      try {
        await breakdownAPI.delete(breakdownId);
        loadBreakdowns();
        alert('Data breakdown berhasil dihapus');
      } catch (error) {
        console.error('Error deleting breakdown:', error);
        alert('Gagal menghapus data breakdown');
      }
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedBreakdown(null);
    loadBreakdowns();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      breakdown: { color: 'bg-red-100 text-red-800', text: 'Breakdown' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      ready: { color: 'bg-green-100 text-green-800', text: 'Ready' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      service: { color: 'bg-blue-100 text-blue-800', text: 'Service' },
      pms: { color: 'bg-purple-100 text-purple-800', text: 'PMS' },
      storing: { color: 'bg-orange-100 text-orange-800', text: 'Storing' }
    };
    
    const config = categoryConfig[category] || { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  if (showForm) {
    return (
      <div className="flex-1 overflow-auto">
        <Header 
          title={selectedBreakdown ? "Edit Breakdown" : "Breakdown Baru"}
          subtitle="Form input data kerusakan equipment"
        />
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setShowForm(false)}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                ← Kembali ke Daftar
              </button>
            </div>
            <BreakdownForm
              breakdownId={selectedBreakdown}
              onSave={handleFormSave}
            />
          </div>
        </div>
      </div>
    );
  }

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
        title="Data Breakdown Equipment"
        subtitle="Kelola data kerusakan dan perbaikan equipment"
      />
      
      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari equipment, lokasi, atau pelapor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-80"
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Semua Status</option>
                      <option value="breakdown">Breakdown</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready">Ready</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* New Breakdown Button */}
          {canInputData && (
            <button
              onClick={handleNewBreakdown}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Breakdown Baru
            </button>
          )}
        </div>

        {/* Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelapor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdowns.map((breakdown) => (
                  <tr key={breakdown.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {breakdown.equipment_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(breakdown.tanggal).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {breakdown.jam_mulai 
                          ? `${new Date(breakdown.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                          : '-'} - {breakdown.jam_selesai 
                          ? new Date(breakdown.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : 'Ongoing'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{breakdown.lokasi}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(breakdown.kategori_perawatan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(breakdown.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{breakdown.pelapor_bd}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {breakdown.problem}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canViewData && (
                          <button
                            onClick={() => handleViewBreakdown(breakdown.id)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canInputData && (
                          <button
                            onClick={() => handleEditBreakdown(breakdown.id)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {authService.canAccessAdminFeatures() && (
                          <button
                            onClick={() => handleDeleteBreakdown(breakdown.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {breakdowns.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm || filters.status || filters.date_from || filters.date_to 
                  ? 'Tidak ada data yang sesuai dengan pencarian' 
                  : 'Belum ada data breakdown'}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {breakdowns.length > 0 && (
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
      </div>
    </div>
  );
};

export default BreakdownPage;