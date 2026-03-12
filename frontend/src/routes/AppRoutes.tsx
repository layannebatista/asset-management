import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Layout from '../components/layout/Layout'

import LoginPage from '../pages/auth/LoginPage'
import ActivateAccountPage from '../pages/auth/ActivateAccountPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import AssetListPage from '../pages/assets/AssetListPage'
import AssetDetailsPage from '../pages/assets/AssetDetailsPage'
import TransfersPage from '../pages/transfers/TransfersPage'
import MaintenancePage from '../pages/maintenance/MaintenancePage'
import InventoryPage from '../pages/inventory/InventoryPage'
import UsersPage from '../pages/users/UsersPage'
import AuditPage from '../pages/audit/AuditPage'
import ReportsPage from '../pages/reports/ReportsPage'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<ActivateAccountPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected — inside persistent Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetListPage />} />
          <Route path="/assets/:id" element={<AssetDetailsPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/inventory" element={<InventoryPage />} />

          {/* Admin/Gestor only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute roles={['ADMIN', 'GESTOR']}>
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['ADMIN', 'GESTOR']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
