import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const SIDEBAR_KEY = 'sidebar:collapsed'

export default function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false

    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true'
    } catch {
      return false
    }
  })

  // persistência do estado (com proteção)
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    } catch {
      // evita crash silencioso
    }
  }, [collapsed])

  // memoizado (evita re-render em children)
  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}