import { Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/common/ProtectedRoute';
import DashboardLayout   from './components/layout/DashboardLayout';

// Public
import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage   from './pages/RegisterPage';
import NotFound       from './pages/NotFound';

// Shared (all authenticated users)
import ProfilePage       from './pages/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Non-admin dashboard
import DashboardPage from './pages/DashboardPage';

// B2B — Manufacturer + Distributor (sellers) + Pharmacy + Hospital (buyers)
import ProductsPage      from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrdersPage        from './pages/OrdersPage';
import OrderDetailPage   from './pages/OrderDetailPage';
import InvoicesPage      from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

// Manufacturer only
import ManufacturerProductsPage from './pages/manufacturer/ManufacturerProductsPage';

// Distributor + Pharmacy + Hospital (retail/trading operations)
import InventoryPage  from './pages/inventory/InventoryPage';
import BatchesPage    from './pages/inventory/BatchesPage';
import ExpiryPage     from './pages/inventory/ExpiryPage';
import BillingPage    from './pages/billing/BillingPage';
import PurchasePage   from './pages/purchase/PurchasePage';
import ReportsPage    from './pages/reports/ReportsPage';
import AccountingPage from './pages/accounting/AccountingPage';

// Distributor + Pharmacy only (customer management)
import CustomersPage  from './pages/customers/CustomersPage';

// Admin only
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage     from './pages/admin/AdminUsersPage';
import AdminPendingPage   from './pages/admin/AdminPendingPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminOrdersPage    from './pages/admin/AdminOrdersPage';
import AdminProductsPage  from './pages/admin/AdminProductsPage';
import AdminInvoicesPage  from './pages/admin/AdminInvoicesPage';

// ── Strict role groups ────────────────────────────────────
const B2B_ROLES     = ['manufacturer','distributor','pharmacy','hospital'];
const BUYER_ROLES   = ['distributor','pharmacy','hospital'];   // can place orders
const TRADING_ROLES = ['distributor','pharmacy','hospital'];   // has inventory + billing
const CUSTOMER_ROLES= ['distributor','pharmacy'];              // manages customers/clients

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Public */}
        <Route path="/"            element={<LandingPage/>}/>
        <Route path="/login"       element={<LoginPage/>}/>
        <Route path="/admin/login" element={<AdminLoginPage/>}/>
        <Route path="/register"    element={<RegisterPage/>}/>

        {/* Protected */}
        <Route element={<ProtectedRoute/>}>
          <Route element={<DashboardLayout/>}>

            {/* Every logged-in user */}
            <Route path="/profile"       element={<ProfilePage/>}/>
            <Route path="/notifications" element={<NotificationsPage/>}/>

            {/* All non-admin roles */}
            <Route element={<ProtectedRoute roles={B2B_ROLES}/>}>
              <Route path="/dashboard"    element={<DashboardPage/>}/>
              <Route path="/orders"       element={<OrdersPage/>}/>
              <Route path="/orders/:id"   element={<OrderDetailPage/>}/>
              <Route path="/invoices"     element={<InvoicesPage/>}/>
              <Route path="/invoices/:id" element={<InvoiceDetailPage/>}/>
            </Route>

            {/* Buyer roles — can browse and order products */}
            <Route element={<ProtectedRoute roles={BUYER_ROLES}/>}>
              <Route path="/products"     element={<ProductsPage/>}/>
              <Route path="/products/:id" element={<ProductDetailPage/>}/>
            </Route>

            {/* Manufacturer only — manage own products */}
            <Route element={<ProtectedRoute roles={['manufacturer']}/>}>
              <Route path="/my-products" element={<ManufacturerProductsPage/>}/>
            </Route>

            {/* Trading roles — inventory, billing, purchase, reports, accounting */}
            <Route element={<ProtectedRoute roles={TRADING_ROLES}/>}>
              <Route path="/inventory"         element={<InventoryPage/>}/>
              <Route path="/inventory/batches" element={<BatchesPage/>}/>
              <Route path="/inventory/expiry"  element={<ExpiryPage/>}/>
              <Route path="/billing"           element={<BillingPage/>}/>
              <Route path="/purchase"          element={<PurchasePage/>}/>
              <Route path="/reports"           element={<ReportsPage/>}/>
              <Route path="/accounting"        element={<AccountingPage/>}/>
            </Route>

            {/* Customer management — distributor and pharmacy only */}
            <Route element={<ProtectedRoute roles={CUSTOMER_ROLES}/>}>
              <Route path="/customers" element={<CustomersPage/>}/>
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={['admin']}/>}>
              <Route path="/admin/dashboard"    element={<AdminDashboardPage/>}/>
              <Route path="/admin/users"        element={<AdminUsersPage/>}/>
              <Route path="/admin/pending"      element={<AdminPendingPage/>}/>
              <Route path="/admin/analytics"    element={<AdminAnalyticsPage/>}/>
              <Route path="/admin/orders"       element={<AdminOrdersPage/>}/>
              <Route path="/admin/products"     element={<AdminProductsPage/>}/>
              <Route path="/admin/invoices"     element={<AdminInvoicesPage/>}/>
              <Route path="/admin/invoices/:id" element={<InvoiceDetailPage/>}/>
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </AuthProvider>
  );
}
