import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import Layout from '../components/layout/Layout'

// Pages
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
import OrganizationsPage from '../pages/organizations/OrganizationsPage'
import UnitsPage from '../pages/units/UnitsPage'

// ─────────────────────────────────────────────────────────
// Role wrappers (elimina repetição)
// ─────────────────────────────────────────────────────────
const AdminOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute roles={['ADMIN']}>{children}</ProtectedRoute>
)

const AdminOrGestor = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute roles={['ADMIN', 'GESTOR']}>{children}</ProtectedRoute>
)

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ───────────── PUBLIC ───────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<ActivateAccountPage />} />

        {/* FIX: proteger root */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* ───────────── PROTECTED ROOT ───────────── */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Core */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Assets */}
          <Route path="/assets" element={<AssetListPage />} />
          <Route path="/assets/:id" element={<AssetDetailsPage />} />

          {/* Operations */}
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/inventory" element={<InventoryPage />} />

          {/* Admin */}
          <Route
            path="/organizations"
            element={
              <AdminOnly>
                <OrganizationsPage />
              </AdminOnly>
            }
          />

          <Route
            path="/users"
            element={
              <AdminOnly>
                <UsersPage />
              </AdminOnly>
            }
          />

          {/* Admin + Gestor */}
          <Route
            path="/units"
            element={
              <AdminOnly>
                <UnitsPage />
              </AdminOnly>
            }
          />

          <Route
            path="/audit"
            element={
              <AdminOrGestor>
                <AuditPage />
              </AdminOrGestor>
            }
          />

          <Route
            path="/reports"
            element={
              <AdminOrGestor>
                <ReportsPage />
              </AdminOrGestor>
            }
          />
        </Route>

        {/* FIX: fallback global */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}