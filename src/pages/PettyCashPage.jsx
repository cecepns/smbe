import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, CreditCard, Download } from 'lucide-react';
import Header from '../components/Header';
import { pettyCashAPI, breakdownAPI, masterAPI } from '../utils/api';
import authService from '../services/authService';

const PettyCashPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    breakdown_id: '',
    expense_type: '',
    date_from: '',
    date_to: ''
  });
  const [formData, setFormData] = useState({
    breakdown_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'tol',
    description: '',
    amount: '',
    location_from_id: '',
    location_to_id: '',
    distance_km: '',
    receipt_number: '',
    mechanic_id: '',
    vehicle_used: '',
    notes: ''
  });

  const loadMasterData = async () => {
    try {
      const [breakdownsRes, mechanicsRes, locationsRes] = await Promise.all([
        breakdownAPI.getAll({ limit: 1000 }),
        masterAPI.getMechanics(),
        masterAPI.getLocations()
      ]);
      // Handle breakdownAPI response format: { data: [...], total: ... }
      const breakdownData = breakdownsRes.data?.data || breakdownsRes.data || [];
      setBreakdowns(Array.isArray(breakdownData) ? breakdownData : []);
      setMechanics(mechanicsRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const params = {
        ...filters,
        limit,
        offset
      };

      const response = await pettyCashAPI.getTransactions(params);
      
      // Handle response format: { data: [...], total: ... }
      if (response.data && response.data.data) {
        setTransactions(response.data.data);
        setTotal(response.data.total || 0);
      } else if (Array.isArray(response.data)) {
        // Backward compatibility
        setTransactions(response.data);
        setTotal(response.data.length);
      } else {
        setTransactions([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filters]);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await pettyCashAPI.updateTransaction(editingId, formData);
      } else {
        await pettyCashAPI.createTransaction(formData);
      }
      setShowModal(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan data');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      breakdown_id: item.breakdown_id || '',
      expense_date: item.expense_date ? item.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      expense_type: item.expense_type || 'tol',
      description: item.description || '',
      amount: item.amount || '',
      location_from_id: item.location_from_id || '',
      location_to_id: item.location_to_id || '',
      distance_km: item.distance_km || '',
      receipt_number: item.receipt_number || '',
      mechanic_id: item.mechanic_id || '',
      vehicle_used: item.vehicle_used || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      await pettyCashAPI.deleteTransaction(id);
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Gagal menghapus data');
    }
  };

  const resetForm = () => {
    setFormData({
      breakdown_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      expense_type: 'tol',
      description: '',
      amount: '',
      location_from_id: '',
      location_to_id: '',
      distance_km: '',
      receipt_number: '',
      mechanic_id: '',
      vehicle_used: '',
      notes: ''
    });
    setEditingId(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getExpenseTypeLabel = (type) => {
    const types = {
      'tol': 'Tol',
      'bensin': 'Bensin',
      'parkir': 'Parkir',
      'inap': 'Inap',
      'makan': 'Makan',
      'lainnya': 'Lainnya'
    };
    return types[type] || type;
  };

  // Client-side search filter (applied after server-side pagination)
  const filteredTransactions = transactions.filter(item =>
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mechanic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleExport = async () => {
    try {
      // Export functionality - implement actual API call here
      alert('Export feature akan segera tersedia');
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export data');
    }
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
        title="Petty Cash / Biaya Perjalanan" 
        subtitle="Kelola biaya perjalanan dan operasional mekanik"
      />
      
      <div className="p-4">
        {/* Filters */}
        <div className="mb-3 bg-white rounded-lg shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Breakdown
              </label>
              <select
                value={filters.breakdown_id}
                onChange={(e) => handleFilterChange('breakdown_id', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Breakdown</option>
                {Array.isArray(breakdowns) && breakdowns.map(bd => (
                  <option key={bd.id} value={bd.id}>{bd.equipment_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipe Biaya
              </label>
              <select
                value={filters.expense_type}
                onChange={(e) => handleFilterChange('expense_type', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Tipe</option>
                <option value="tol">Tol</option>
                <option value="bensin">Bensin</option>
                <option value="parkir">Parkir</option>
                <option value="inap">Inap</option>
                <option value="makan">Makan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
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
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            {authService.getUserRole() === 'inputer' && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah</span>
              </button>
            )}
            <button
              onClick={() => handleExport()}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="text-xs text-gray-600">Total Biaya</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0))}
            </div>
          </div>
          {['tol', 'bensin', 'parkir', 'inap'].map(type => {
            const total = transactions
              .filter(t => t.expense_type === type)
              .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            return (
              <div key={type} className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600">{getExpenseTypeLabel(type)}</div>
                <div className="text-base font-bold text-gray-900">
                  {formatCurrency(total)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe Biaya
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mekanik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.expense_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {getExpenseTypeLabel(item.expense_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{item.description || '-'}</div>
                    {item.receipt_number && (
                      <div className="text-xs text-gray-500">No: {item.receipt_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.amount || 0)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.location_from_name && item.location_to_name ? (
                      <div>
                        <div>{item.location_from_name} → {item.location_to_name}</div>
                        {item.distance_km && (
                          <div className="text-xs text-gray-400">{item.distance_km} km</div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.mechanic_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.equipment_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada data transaksi</p>
            </div>
          )}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Biaya' : 'Tambah Biaya'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Breakdown - connects with maintenance category */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Breakdown (Kategori Perawatan) *
                  </label>
                  <select
                    required
                    value={formData.breakdown_id}
                    onChange={(e) => {
                      const selectedBD = breakdowns.find(bd => bd.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        breakdown_id: e.target.value,
                        // Auto-fill locations from breakdown if available
                        location_from_id: selectedBD?.lokasi ? locations.find(l => l.name === selectedBD.lokasi)?.id || formData.location_from_id : formData.location_from_id
                      });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih Breakdown</option>
                    {Array.isArray(breakdowns) && breakdowns.filter(bd => 
                      ['service', 'pms', 'storing'].includes(bd.kategori_perawatan?.toLowerCase())
                    ).map(bd => (
                      <option key={bd.id} value={bd.id}>
                        {bd.equipment_number} - {bd.kategori_perawatan}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hanya breakdown dengan kategori Service/PMS/Storing</p>
                </div>
                
                {/* Dari Lokasi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dari Lokasi *
                  </label>
                  <select
                    required
                    value={formData.location_from_id}
                    onChange={(e) => setFormData({ ...formData, location_from_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Ke Lokasi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ke Lokasi *
                  </label>
                  <select
                    required
                    value={formData.location_to_id}
                    onChange={(e) => setFormData({ ...formData, location_to_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Jarak - with table selection option */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jarak (KM) *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={formData.distance_km}
                      onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                      placeholder="Input jarak"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Open distance table/modal
                        alert('Fitur tabel jarak akan segera tersedia');
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Pilih dari tabel jarak"
                    >
                      Tabel
                    </button>
                  </div>
                </div>
                
                {/* Tipe Biaya */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipe Biaya *
                  </label>
                  <select
                    required
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="tol">Tol</option>
                    <option value="bensin">Bensin</option>
                    <option value="parkir">Parkir</option>
                    <option value="inap">Inap</option>
                    <option value="makan">Makan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                
                {/* Tanggal Biaya */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tanggal Biaya *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* Jumlah */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jumlah (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* No. Receipt */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    No. Receipt
                  </label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* Mekanik */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mekanik
                  </label>
                  <select
                    value={formData.mechanic_id}
                    onChange={(e) => setFormData({ ...formData, mechanic_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih Mekanik</option>
                    {mechanics.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Kendaraan */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kendaraan
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle_used}
                    onChange={(e) => setFormData({ ...formData, vehicle_used: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* Keterangan */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* Catatan */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="h-5 w-5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashPage;

