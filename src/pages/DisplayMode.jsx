import { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, Moon, Sun } from 'lucide-react';
import { breakdownAPI } from '../utils/api';
import authService from '../services/authService';

const DisplayMode = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [groupedData, setGroupedData] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute (60 seconds)
  const [darkMode, setDarkMode] = useState(false); // Default to light mode
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10); // Show 10 units per page for better visibility
  
  // Auto-refresh configuration - can be changed via query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intervalParam = params.get('refresh');
    if (intervalParam) {
      // Allow custom refresh interval via URL parameter (in seconds)
      // e.g., /display/daily-breakdown?refresh=30 (refresh every 30 seconds)
      setRefreshInterval(parseInt(intervalParam) * 1000);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const params = {
        date_from: today,
        date_to: today,
        limit: 1000
      };

      // If user has location restriction, filter by location
      const userLocation = authService.getUserLocation();
      if (userLocation) {
        params.location = userLocation;
      }

      const response = await breakdownAPI.getAll(params);
      const data = response.data?.data || response.data || [];
      setLastUpdate(new Date());
      
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Auto-scroll pages when there are more than itemsPerPage units
  useEffect(() => {
    if (!autoRefresh) return;
    
    const groupKeys = Object.keys(groupedData);
    if (groupKeys.length <= itemsPerPage) return;
    
    const totalPages = Math.ceil(groupKeys.length / itemsPerPage);
    const pageInterval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 30000); // Change page every 30 seconds

    return () => clearInterval(pageInterval);
  }, [autoRefresh, groupedData, itemsPerPage]);

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 0;
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = (end - start) / (1000 * 60 * 60);
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


  // Fullscreen display mode - no sidebar/header
  return (
    <div className={`fixed inset-0 overflow-auto transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header Bar */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'} p-4 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center space-x-4">
          <Monitor className="h-6 w-6" />
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>DAILY BREAKDOWN REPORT</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Last Update: {lastUpdate.toLocaleTimeString('id-ID')} | 
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} ({refreshInterval / 1000}s)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-12 w-12 animate-spin text-primary-500" />
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="text-center py-20">
            <p className={`text-2xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada data breakdown hari ini</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pagination Info */}
            {Object.keys(groupedData).length > itemsPerPage && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 flex items-center justify-between`}>
                <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Total Units: {Object.keys(groupedData).length} | 
                  Showing page {currentPage + 1} of {Math.ceil(Object.keys(groupedData).length / itemsPerPage)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(Object.keys(groupedData).length / itemsPerPage) - 1, prev + 1))}
                    disabled={currentPage >= Math.ceil(Object.keys(groupedData).length / itemsPerPage) - 1}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {Object.entries(groupedData)
              .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
              .map(([equipmentKey, items]) => {
              const breakdownCount = items.length;
              return (
                <div key={equipmentKey} className={`${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'} rounded-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Unit: {equipmentKey}
                    </h2>
                    {breakdownCount > 0 && (
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        darkMode 
                          ? 'bg-red-900 text-red-200' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        PA: {breakdownCount} Breakdown{breakdownCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Code Number</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>HM BD</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type BD</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>RFU</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notif Num</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>MO</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durasi (Jam)</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Problem</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Lokasi</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr 
                            key={item.id} 
                            className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
                              idx % 2 === 0 
                                ? (darkMode ? 'bg-gray-750' : 'bg-gray-50') 
                                : (darkMode ? 'bg-gray-800' : 'bg-white')
                            }`}
                          >
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.equipment_number}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.hm_breakdown || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.tipe_bd || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{formatTime(item.jam_mulai)}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              {item.rfu === 'ready' ? '✓' : item.rfu || '-'}
                            </td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.work_order || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.wr_pr || '-'}</td>
                            <td className={`px-4 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              {calculateDuration(item.jam_mulai, item.jam_selesai)}
                            </td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.note_plant || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.problem || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.lokasi || item.location_name || '-'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.customer || '-'}</td>
                          </tr>
                        ))}
                        <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-bold`}>
                          <td colSpan="8" className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>TOTAL</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {items.reduce((sum, item) => 
                              sum + parseFloat(calculateDuration(item.jam_mulai, item.jam_selesai)), 0
                            ).toFixed(2)} Jam
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}></td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}></td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Bottom Pagination */}
            {Object.keys(groupedData).length > itemsPerPage && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 flex items-center justify-center`}>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.ceil(Object.keys(groupedData).length / itemsPerPage) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        currentPage === i
                          ? 'bg-primary-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayMode;

