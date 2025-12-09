import React, { useState, useEffect } from 'react';
import { Save, FileDown, AlertCircle, Clock, Wrench, CheckCircle } from 'lucide-react';
import { breakdownAPI, masterAPI } from '../utils/api';
import authService from '../services/authService';

const BreakdownForm = ({ breakdownId, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    // Tab 1 - Data Utama
    tanggal: '',
    shift: '',
    equipment_number: '',
    kode: '',
    lokasi: '',
    hm_breakdown: '',
    jam_mulai: '',
    jam_selesai: '',
    kategori_perawatan: '',
    perlu_petty_cash: '',
    
    // Tab 2 - Informasi Plant
    pelapor_bd: '',
    work_order: '',
    wr_pr: '',
    tipe_bd: '',
    note_ccr: '',
    note_plant: '',
    km: '',
    komponen: '',
    problem: '',
    
    // Tab 3 - Aktivitas & Estimasi
    estimasi_1: '',
    estimasi_2: '',
    estimasi_3: '',
    penerima_rfu: '',
    aktivitas: '',
    detail_aktivitas: '',
    jam_aktivitas: '',
    
    // Tab 4 - Informasi RFU
    rfu: '',
    hm_rfu_1: '',
    pelapor_rfu: ''
  });

  const [masterData, setMasterData] = useState({
    equipment: [],
    locations: [],
    mechanics: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const tabs = [
    { name: 'Data Utama', icon: AlertCircle },
    { name: 'Informasi Plant', icon: FileDown },
    { name: 'Aktivitas & Estimasi', icon: Wrench },
    { name: 'Informasi RFU', icon: CheckCircle }
  ];

  const kategoriOptions = [
    { value: 'service', label: 'Terjadwal / Service' },
    { value: 'pms', label: 'PMS (Service di lokasi)' },
    { value: 'storing', label: 'Storing / Tidak terjadwal' }
  ];

  const shiftOptions = [
    { value: '1', label: 'Shift 1' },
    { value: '2', label: 'Shift 2' },
    { value: '3', label: 'Shift 3' }
  ];

  const tipeBdOptions = [
    { value: 'mesin', label: 'Mesin' },
    { value: 'elektrik', label: 'Elektrik' },
    { value: 'hidrolik', label: 'Hidrolik' },
    { value: 'pneumatik', label: 'Pneumatik' },
    { value: 'body', label: 'Body' }
  ];

  const aktivitasOptions = [
    { value: 'inspeksi', label: 'Inspeksi' },
    { value: 'perbaikan', label: 'Perbaikan' },
    { value: 'penggantian', label: 'Penggantian' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'cleaning', label: 'Cleaning' }
  ];

  useEffect(() => {
    loadMasterData();
    if (breakdownId) {
      loadBreakdownData();
    } else {
      // Set default location for new breakdown based on user location
      const userLocation = authService.getUserLocation();
      if (userLocation && authService.getUserRole() !== 'admin') {
        setFormData(prev => ({ ...prev, lokasi: userLocation }));
      }
    }
  }, [breakdownId]);

  const loadMasterData = async () => {
    try {
      const [equipmentRes, locationsRes, mechanicsRes] = await Promise.all([
        masterAPI.getEquipment(),
        masterAPI.getLocations(),
        masterAPI.getMechanics()
      ]);

      setMasterData({
        equipment: equipmentRes.data,
        locations: locationsRes.data,
        mechanics: mechanicsRes.data
      });
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  // Helper function to convert ISO datetime string to date format (yyyy-MM-dd)
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Handle timezone offset by converting to local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Helper function to convert ISO datetime string to datetime-local format (yyyy-MM-ddThh:mm)
  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Handle timezone offset by converting to local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const loadBreakdownData = async () => {
    try {
      setLoading(true);
      const response = await breakdownAPI.getById(breakdownId);
      const data = response.data;
      
      // Auto-set location based on user's location if not admin
      const userLocation = authService.getUserLocation();
      if (userLocation && authService.getUserRole() !== 'admin' && !data.lokasi) {
        data.lokasi = userLocation;
      }
      
      // Format date and datetime fields for HTML input elements
      const formattedData = {
        ...data,
        tanggal: formatDateForInput(data.tanggal),
        jam_mulai: formatDateTimeForInput(data.jam_mulai),
        jam_selesai: formatDateTimeForInput(data.jam_selesai),
        estimasi_1: formatDateTimeForInput(data.estimasi_1),
        estimasi_2: formatDateTimeForInput(data.estimasi_2),
        estimasi_3: formatDateTimeForInput(data.estimasi_3)
      };
      
      setFormData(formattedData);
    } catch (error) {
      console.error('Error loading breakdown data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Tab 1 validation
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    if (!formData.equipment_number) newErrors.equipment_number = 'Equipment Number wajib diisi';
    if (!formData.kategori_perawatan) newErrors.kategori_perawatan = 'Kategori Perawatan wajib dipilih';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      let response;
      
      if (breakdownId) {
        response = await breakdownAPI.update(breakdownId, formData);
      } else {
        response = await breakdownAPI.create(formData);
      }
      
      if (onSave) onSave(response.data);
      alert('Data berhasil disimpan!');
    } catch (error) {
      console.error('Error saving breakdown:', error);
      alert('Gagal menyimpan data: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setLoading(true);
      const response = type === 'excel' 
        ? await breakdownAPI.exportExcel({ id: breakdownId })
        : await breakdownAPI.exportPDF({ id: breakdownId });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `breakdown_${breakdownId}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export data');
    } finally {
      setLoading(false);
    }
  };

  console.log(formData);

  const renderTab1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanggal *
        </label>
        <input
          type="date"
          value={formData.tanggal}
          onChange={(e) => handleInputChange('tanggal', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.tanggal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shift
        </label>
        <select
          value={formData.shift}
          onChange={(e) => handleInputChange('shift', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Pilih Shift</option>
          {shiftOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Equipment Number *
        </label>
        <select
          value={formData.equipment_number}
          onChange={(e) => handleInputChange('equipment_number', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.equipment_number ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Pilih Equipment</option>
          {masterData.equipment.map(eq => (
            <option key={eq.id} value={eq.equipment_number}>{eq.equipment_number} - {eq.name}</option>
          ))}
        </select>
        {errors.equipment_number && <p className="text-red-500 text-xs mt-1">{errors.equipment_number}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kode
        </label>
        <input
          type="text"
          value={formData.kode}
          onChange={(e) => handleInputChange('kode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lokasi
        </label>
        <select
          value={formData.lokasi}
          onChange={(e) => handleInputChange('lokasi', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={authService.getUserLocation() && authService.getUserRole() !== 'admin'}
        >
          <option value="">Pilih Lokasi</option>
          {(() => {
            const userLocation = authService.getUserLocation();
            const locations = userLocation && authService.getUserRole() !== 'admin'
              ? masterData.locations.filter(loc => loc.name === userLocation)
              : masterData.locations;
            return locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ));
          })()}
        </select>
        {authService.getUserLocation() && authService.getUserRole() !== 'admin' && (
          <p className="text-xs text-gray-500 mt-1">
            Lokasi dikunci sesuai lokasi Anda: {authService.getUserLocation()}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HM/KM Breakdown *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.hm_breakdown}
          onChange={(e) => handleInputChange('hm_breakdown', e.target.value)}
          placeholder="Masukkan HM atau KM"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Masukkan Hour Meter (HM) atau Kilometer (KM) saat breakdown</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jam Mulai
        </label>
        <input
          type="datetime-local"
          value={formData.jam_mulai}
          onChange={(e) => handleInputChange('jam_mulai', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jam Selesai
        </label>
        <input
          type="datetime-local"
          value={formData.jam_selesai}
          onChange={(e) => handleInputChange('jam_selesai', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategori Perawatan *
        </label>
        <select
          value={formData.kategori_perawatan}
          onChange={(e) => {
            handleInputChange('kategori_perawatan', e.target.value);
            // Reset petty cash selection when category changes
            if (!['service', 'pms', 'storing'].includes(e.target.value.toLowerCase())) {
              handleInputChange('perlu_petty_cash', '');
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.kategori_perawatan ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Pilih Kategori</option>
          {kategoriOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.kategori_perawatan && <p className="text-red-500 text-xs mt-1">{errors.kategori_perawatan}</p>}
      </div>

      {/* Petty Cash Question - Only for Service/PMS/Storing */}
      {['service', 'pms', 'storing'].includes(formData.kategori_perawatan?.toLowerCase()) && (
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perlu uang Petty Cash? *
          </label>
          <select
            value={formData.perlu_petty_cash}
            onChange={(e) => handleInputChange('perlu_petty_cash', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Pilih</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {formData.perlu_petty_cash === 'yes' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 mb-2">
                Setelah menyimpan breakdown, silakan input Petty Cash melalui menu <strong>Petty Cash</strong>.
              </p>
              <p className="text-xs text-blue-600">
                Breakdown ID: {breakdownId ? breakdownId : '(akan tersedia setelah disimpan)'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTab2 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pelapor BD
        </label>
        <input
          type="text"
          value={formData.pelapor_bd}
          onChange={(e) => handleInputChange('pelapor_bd', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Order
        </label>
        <input
          type="text"
          value={formData.work_order}
          onChange={(e) => handleInputChange('work_order', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          WR / PR
        </label>
        <input
          type="text"
          value={formData.wr_pr}
          onChange={(e) => handleInputChange('wr_pr', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipe BD
        </label>
        <select
          value={formData.tipe_bd}
          onChange={(e) => handleInputChange('tipe_bd', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Pilih Tipe</option>
          {tipeBdOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note by CCR
        </label>
        <textarea
          rows={3}
          value={formData.note_ccr}
          onChange={(e) => handleInputChange('note_ccr', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note by Plant
        </label>
        <textarea
          rows={3}
          value={formData.note_plant}
          onChange={(e) => handleInputChange('note_plant', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          KM
        </label>
        <input
          type="number"
          value={formData.km}
          onChange={(e) => handleInputChange('km', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Komponen
        </label>
        <input
          type="text"
          value={formData.komponen}
          onChange={(e) => handleInputChange('komponen', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Problem
        </label>
        <textarea
          rows={4}
          value={formData.problem}
          onChange={(e) => handleInputChange('problem', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Deskripsikan masalah yang terjadi..."
        />
      </div>
    </div>
  );

  const renderTab3 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Estimasi Waktu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimasi 1
            </label>
            <input
              type="datetime-local"
              value={formData.estimasi_1}
              onChange={(e) => handleInputChange('estimasi_1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimasi 2
            </label>
            <input
              type="datetime-local"
              value={formData.estimasi_2}
              onChange={(e) => handleInputChange('estimasi_2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimasi 3
            </label>
            <input
              type="datetime-local"
              value={formData.estimasi_3}
              onChange={(e) => handleInputChange('estimasi_3', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Wrench className="h-5 w-5 mr-2" />
          Aktivitas Perbaikan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penerima RFU
            </label>
            <select
              value={formData.penerima_rfu}
              onChange={(e) => handleInputChange('penerima_rfu', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih Mekanik</option>
              {masterData.mechanics.map(mechanic => (
                <option key={mechanic.id} value={mechanic.name}>{mechanic.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktivitas
            </label>
            <select
              value={formData.aktivitas}
              onChange={(e) => handleInputChange('aktivitas', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih Aktivitas</option>
              {aktivitasOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detail Aktivitas
            </label>
            <textarea
              rows={4}
              value={formData.detail_aktivitas}
              onChange={(e) => handleInputChange('detail_aktivitas', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Jelaskan detail aktivitas yang dilakukan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jam Aktivitas
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.jam_aktivitas}
              onChange={(e) => handleInputChange('jam_aktivitas', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Jumlah jam"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab4 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          RFU (Ready For Use)
        </label>
        <select
          value={formData.rfu}
          onChange={(e) => handleInputChange('rfu', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Pilih Status</option>
          <option value="ready">Ready</option>
          <option value="not_ready">Not Ready</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HM RFU 1
        </label>
        <input
          type="number"
          value={formData.hm_rfu_1}
          onChange={(e) => handleInputChange('hm_rfu_1', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pelapor RFU
        </label>
        <input
          type="text"
          value={formData.pelapor_rfu}
          onChange={(e) => handleInputChange('pelapor_rfu', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nama pelapor RFU"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === index
                    ? 'border-primary-500 text-primary-600'
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

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 0 && renderTab1()}
        {activeTab === 1 && renderTab2()}
        {activeTab === 2 && renderTab3()}
        {activeTab === 3 && renderTab4()}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
        <div className="flex space-x-3">
          {breakdownId && (
            <>
              <button
                onClick={() => handleExport('excel')}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </div>
    </div>
  );
};

export default BreakdownForm;