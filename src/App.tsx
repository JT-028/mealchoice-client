import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { ProductsPage } from './pages/seller/ProductsPage';

// Component to redirect users to their role-specific dashboard
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (user?.role === 'seller') {
    return <Navigate to="/seller" replace />;
  }
  
  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Customer Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />

          {/* Seller Routes */}
          <Route 
            path="/seller" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seller/products" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seller/orders" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <div className="p-8 text-center text-muted-foreground">
                  Orders page coming soon...
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seller/messages" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <div className="p-8 text-center text-muted-foreground">
                  Messages page coming soon...
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seller/settings" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <div className="p-8 text-center text-muted-foreground">
                  Settings page coming soon...
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
