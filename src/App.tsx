import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ChatProvider } from './contexts/ChatContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Seller pages
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { ProductsPage } from './pages/seller/ProductsPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerMessagesPage } from './pages/seller/SellerMessagesPage';
import { SellerSettingsPage } from './pages/seller/SellerSettingsPage';

// Customer pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BrowseProducts } from './pages/customer/BrowseProducts';
import { BudgetSettings } from './pages/customer/BudgetSettings';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { CustomerMessagesPage } from './pages/customer/CustomerMessagesPage';
import { CustomerSettingsPage } from './pages/customer/CustomerSettingsPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PendingSellersPage } from './pages/admin/PendingSellersPage';
import { SellersPage } from './pages/admin/SellersPage';

// Component to redirect users to their role-specific dashboard
function DashboardRedirect() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'seller') {
    return <Navigate to="/seller" replace />;
  }

  return <Navigate to="/customer" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Dashboard Redirect */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pending"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PendingSellersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sellers"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SellersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="p-8 text-center text-muted-foreground">
                      Admin settings coming soon...
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/browse"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <BrowseProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/orders"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/messages"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/meals"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <div className="p-8 text-center text-muted-foreground">
                      Meal Planner coming soon...
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/budget"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <BudgetSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/settings"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerSettingsPage />
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
                    <SellerOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/messages"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/settings"
                element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerSettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

