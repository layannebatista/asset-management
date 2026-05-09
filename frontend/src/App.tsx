import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { TestIdInjector } from './components/TestIdInjector'

export default function App() {
  return (
    <AuthProvider>
      <TestIdInjector />
      <AppRoutes />
    </AuthProvider>
  )
}
