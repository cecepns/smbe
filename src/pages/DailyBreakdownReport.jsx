import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import { breakdownAPI } from '../utils/api';
import authService from '../services/authService';

const DailyBreakdownReport = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupedData, setGroupedData] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date_from: startDate,
        date_to: stopDate,
        limit: 1000
      };

      // If user has location restriction, filter by location
      const userLocation = authService.getUserLocation();
      if (userLocation) {
        params.location = userLocation;
      }

      const response = await breakdownAPI.getAll(params);
      const data = response.data?.data || response.data || [];
      
      // Group by equipment type/code
      const grouped = {};
      data.forEach(item => {
        const key = item.equipment_number || item.equipment_name || 'Unknown';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });
      setGroupedData(grouped);
    } catch (error) {
      console.error('Error loading daily breakdown:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [startDate, stopDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 0;
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = (end - start) / (1000 * 60 * 60); // Convert to hours
    return diff.toFixed(2);
  };

  const formatTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExport = () => {
    // TODO: Implement export to Excel/PDF
    alert('Export feature coming soon');
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
        title="Daily Breakdown Report" 
        subtitle="Laporan breakdown harian per equipment"
      />
      
      <div className="p-4">
        {/* Filters */}
        <div className="mb-3 bg-white rounded-lg shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stop Date</label>
              <input
                type="date"
                value={stopDate}
                onChange={(e) => setStopDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
              <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                <option>Semua Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lokasi</label>
              <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                <option>Semua Lokasi</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-gray-900">DAILY BREAKDOWN REPORT</h2>
            <p className="text-sm text-gray-600 mt-1">
              Periode: {formatDate(startDate)} {startDate !== stopDate ? `- ${formatDate(stopDate)}` : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            {Object.keys(groupedData).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data breakdown untuk tanggal ini</p>
              </div>
            ) : (
              Object.entries(groupedData).map(([equipmentKey, items]) => (
                <div key={equipmentKey} className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 bg-blue-50 p-2 rounded">
                    Unit: {equipmentKey}
                  </h3>
                  <table className="min-w-full divide-y divide-gray-200 mb-3">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Code Number</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">HM BD</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Type BD</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">RFU</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Notif Num</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">MO</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Durasi (Jam)</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.equipment_number}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.hm_breakdown || '-'}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.tipe_bd || '-'}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{formatTime(item.jam_mulai)}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">
                            {item.rfu === 'ready' ? '✓' : item.rfu || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.work_order || '-'}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.wr_pr || '-'}</td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">
                            {calculateDuration(item.jam_mulai, item.jam_selesai)}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">{item.problem || item.note_plant || '-'}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="7" className="px-2 py-1.5 text-xs text-gray-900">TOTAL</td>
                        <td className="px-2 py-1.5 text-xs text-gray-900">
                          {items.reduce((sum, item) => 
                            sum + parseFloat(calculateDuration(item.jam_mulai, item.jam_selesai)), 0
                          ).toFixed(2)} Jam
                        </td>
                        <td className="px-2 py-1.5 text-xs text-gray-900"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBreakdownReport;

