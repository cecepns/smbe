import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw, Calendar } from 'lucide-react';
import Header from '../components/Header';
import { breakdownAPI } from '../utils/api';
import authService from '../services/authService';

const DailyBreakdownReport = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupedData, setGroupedData] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date_from: selectedDate,
        date_to: selectedDate,
        limit: 1000
      };

      // If user has location restriction, filter by location
      const userLocation = authService.getUserLocation();
      if (userLocation) {
        params.location = userLocation;
      }

      const response = await breakdownAPI.getAll(params);
      const data = response.data?.data || response.data || [];
      setBreakdowns(data);
      
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
  }, [selectedDate]);

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
      <div className="flex-1 flex items-center justify-center">
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
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Tanggal:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh</span>
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">DAILY BREAKDOWN REPORT</h2>
            <p className="text-gray-600 mt-2">Tanggal: {formatDate(selectedDate)}</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-blue-50 p-3 rounded">
                    Unit: {equipmentKey}
                  </h3>
                  <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HM BD</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type BD</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notif Num</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MO</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi (Jam)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.equipment_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.hm_breakdown || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.tipe_bd || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatTime(item.jam_mulai)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.rfu === 'ready' ? '✓' : item.rfu || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.work_order || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.wr_pr || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {calculateDuration(item.jam_mulai, item.jam_selesai)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.problem || item.note_plant || '-'}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="7" className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {items.reduce((sum, item) => 
                            sum + parseFloat(calculateDuration(item.jam_mulai, item.jam_selesai)), 0
                          ).toFixed(2)} Jam
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900"></td>
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

