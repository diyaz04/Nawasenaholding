import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import LandingPage from './pages/LandingPage'
import Login from './pages/admin/Login'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/admin/Dashboard'
import SubsidiariesCMS from './pages/admin/Subsidiaries'
import ProductsCMS from './pages/admin/Products'
import ContentCMS from './pages/admin/ContentCMS'
import Inquiries from './pages/admin/Inquiries'
import POS from './pages/admin/POS'
import Patterns from './pages/admin/Patterns'
import Shopee from './pages/admin/Shopee'
import ClosingConfig from './pages/admin/ClosingConfig'
import ClosingHistory from './pages/admin/ClosingHistory'
import Expenses from './pages/admin/Expenses'
import Reports from './pages/admin/Reports'
import Employees from './pages/admin/Employees'
import Payroll from './pages/admin/Payroll'
import PayrollDetail from './pages/admin/PayrollDetail'
import AdminMenu from './pages/admin/AdminMenu'

function App() {
  useEffect(() => {
    document.title = "NAWASENA HOLDING"
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminMenu />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/cms" element={<ContentCMS />} />
              <Route path="/admin/subsidiaries" element={<SubsidiariesCMS />} />
              <Route path="/admin/products" element={<ProductsCMS />} />
              <Route path="/admin/inquiries" element={<Inquiries />} />
              <Route path="/admin/pos" element={<POS />} />
              <Route path="/admin/patterns" element={<Patterns />} />
              <Route path="/admin/shopee" element={<Shopee />} />
              <Route path="/admin/closing-config" element={<ClosingConfig />} />
              <Route path="/admin/expenses" element={<Expenses />} />
              <Route path="/admin/history" element={<ClosingHistory />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/payroll" element={<Payroll />} />
              <Route path="/admin/payroll/:id" element={<PayrollDetail />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
