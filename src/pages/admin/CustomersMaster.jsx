import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Search, Users, X, Edit, Trash2 } from 'lucide-react';
import Header from '../../components/Header';
import authService from '../../services/authService';
import { masterAPI } from '../../utils/api';

const CustomersMaster = () => {
  const user = authService.getUser();
  const canManage = user?.role === 'admin' || user?.role === 'inputer';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: ''
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCustomers = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        const res = await masterAPI.getCustomers({
          page: targetPage,
          search: debouncedSearchTerm.trim() || undefined,
        });
        const { data = [], pagination } = res.data || {};
        setCustomers(data);
        setTotal(pagination?.total ?? data.length);
        setTotalPages(pagination?.totalPages ?? 1);
        if (pagination?.page) {
          setPage(pagination.page);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        alert('Gagal memuat data customer');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm]
  );

  useEffect(() => {
    loadCustomers(page);
  }, [page, loadCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      if (editingId) {
        await masterAPI.updateCustomer(editingId, formData);
      } else {
        await masterAPI.createCustomer(formData);
      }
      setShowModal(false);
      resetForm();
      loadCustomers(page);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Gagal menyimpan data customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      address: ''
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      contact_person: item.contact_person || '',
      contact_phone: item.contact_phone || '',
      contact_email: item.contact_email || '',
      address: item.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus customer ini?')) return;
    try {
      await masterAPI.deleteCustomer(id);
      loadCustomers(page);
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Gagal menghapus data customer');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);


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
        title="Master Customer"
        subtitle="Kelola data customer untuk breakdown & transaksi"
      />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Customer</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alamat
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{item.contact_person || '-'}</div>
                    <div className="text-xs text-gray-400">{item.contact_phone || item.contact_email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.address || '-'}
                  </td>
                  {canManage && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada data customer</p>
            </div>
          )}
          {total > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4 bg-gray-50 space-y-3 md:space-y-0 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex}-{endIndex} dari {total} data
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-700 px-4">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Customer' : 'Tambah Customer'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIC / Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontak (HP / Email)
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="No HP"
                  />
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Email"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  disabled={!canManage}
                >
                  <Save className="h-5 w-5" />
                  <span>{editingId ? 'Update' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersMaster;
