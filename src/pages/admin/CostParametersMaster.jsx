import React, { useState, useEffect } from 'react';
import { Save, Settings, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import { masterAPI } from '../../utils/api';

const CostParametersMaster = () => {
  const [costParams, setCostParams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    toll_per_km: '',
    fuel_per_km: '',
    parking_per_day: '',
    accommodation_per_day: '',
    meal_per_day: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costRes, locationsRes] = await Promise.all([
        masterAPI.getCostParameters(),
        masterAPI.getLocations()
      ]);
      setCostParams(costRes.data);
      setLocations(locationsRes.data);
      
      // Set default values if available
      if (costRes.data.length > 0) {
        const firstParam = costRes.data[0];
        setFormData({
          toll_per_km: firstParam.toll_per_km || '',
          fuel_per_km: firstParam.fuel_per_km || '',
          parking_per_day: firstParam.parking_per_day || '',
          accommodation_per_day: firstParam.accommodation_per_day || '',
          meal_per_day: firstParam.meal_per_day || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await masterAPI.updateCostParameters(formData);
      alert('Parameter biaya berhasil disimpan');
      loadData();
    } catch (error) {
      console.error('Error saving cost parameters:', error);
      alert('Gagal menyimpan parameter biaya');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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
        title="Parameter Biaya" 
        subtitle="Atur parameter biaya perjalanan dan operasional"
      />
      
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Setting Parameter Biaya
            </h3>
            <p className="text-sm text-gray-600">
              Atur parameter biaya yang akan digunakan untuk perhitungan biaya perjalanan mekanik dan operasional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Tol per KM (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formData.toll_per_km}
                    onChange={(e) => setFormData({ ...formData, toll_per_km: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Biaya tol per kilometer untuk perjalanan mekanik
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Bensin per KM (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formData.fuel_per_km}
                    onChange={(e) => setFormData({ ...formData, fuel_per_km: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Biaya bahan bakar per kilometer untuk perjalanan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Parkir per Hari (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formData.parking_per_day}
                    onChange={(e) => setFormData({ ...formData, parking_per_day: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Biaya parkir standar per hari
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Inap per Hari (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formData.accommodation_per_day}
                    onChange={(e) => setFormData({ ...formData, accommodation_per_day: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Biaya penginapan per hari untuk perjalanan dinas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Makan per Hari (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formData.meal_per_day}
                    onChange={(e) => setFormData({ ...formData, meal_per_day: e.target.value })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Biaya makan per hari untuk perjalanan dinas
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Simpan Parameter Biaya</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Cost Parameters by Location */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Parameter Biaya per Rute Lokasi
          </h3>
          {costParams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dari
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ke
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jarak (KM)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Biaya Tol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Biaya Bensin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {costParams.map((param, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {param.location_from_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {param.location_to_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {param.distance_km || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {param.toll_cost ? formatCurrency(param.toll_cost) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {param.fuel_cost ? formatCurrency(param.fuel_cost) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada parameter biaya per rute</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostParametersMaster;

