import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';

// Layout Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BreakdownPage from './pages/BreakdownPage';
import EquipmentMaster from './pages/admin/EquipmentMaster';
import MechanicsMaster from './pages/admin/MechanicsMaster';
import PartsMaster from './pages/admin/PartsMaster';
import LocationsMaster from './pages/admin/LocationsMaster';
import CostParametersMaster from './pages/admin/CostParametersMaster';
import CustomersMaster from './pages/admin/CustomersMaster';
import SparePartsPage from './pages/SparePartsPage';
import PettyCashPage from './pages/PettyCashPage';
import ReportsPage from './pages/ReportsPage';
import DailyBreakdownReport from './pages/DailyBreakdownReport';
import DisplayMode from './pages/DisplayMode';
import UnitDowntimeTable from './pages/UnitDowntimeTable';
import PhysicalAvailability from './pages/PhysicalAvailability';
import UserManagement from './pages/admin/UserManagement';

// Protected Route Component
// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

// Main Layout Component
// eslint-disable-next-line react/prop-types
const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/breakdown"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BreakdownPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/breakdown/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BreakdownPage isNew />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/breakdown/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BreakdownPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Spare Parts */}
        <Route
          path="/spare-parts"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SparePartsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Petty Cash */}
        <Route
          path="/petty-cash"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PettyCashPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Daily Breakdown Report */}
        <Route
          path="/reports/daily-breakdown"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DailyBreakdownReport />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Unit Downtime Table */}
        <Route
          path="/reports/unit-downtime"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UnitDowntimeTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Physical Availability */}
        <Route
          path="/reports/physical-availability"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PhysicalAvailability />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* TV Display Mode - No Layout */}
        <Route
          path="/display/daily-breakdown"
          element={
            <ProtectedRoute>
              <DisplayMode />
            </ProtectedRoute>
          }
        />
        
        {/* User Management - Admin Only */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Master Data Routes */}
        <Route
          path="/master/equipment"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EquipmentMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/master/mechanics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MechanicsMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/master/parts"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PartsMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/master/locations"
          element={
            <ProtectedRoute>
              <MainLayout>
                <LocationsMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomersMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/master/cost-parameters"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CostParametersMaster />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;