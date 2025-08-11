import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataSelectionProvider } from './context/DataSelectionContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import DataManagement from './pages/DataManagement';
import PhoneBrands from './pages/PhoneBrands';
import PercentageConfig from './pages/PercentageConfig';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <DataSelectionProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* 公開路由 */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
              </Route>
              
              {/* 管理員登入 */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* 受保護的管理員路由 */}
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="data-management" element={<DataManagement />} />
                <Route path="phone-brands" element={<PhoneBrands />} />
                <Route path="percentage-config" element={<PercentageConfig />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* 萬用路由 - 重導向至首頁 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* 全域提示通知 */}
            <Toaster position="top-center" />
          </div>
        </Router>
      </DataSelectionProvider>
    </AuthProvider>
  );
}

export default App; 