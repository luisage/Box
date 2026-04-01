'use client'

import { useState } from 'react'
import SidebarNav from '@/app/dashboard/components/SidebarNav'

export default function DashboardShell({
  children,
  userName,
}: {
  children: React.ReactNode
  userName: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex">

      {/* ── SIDEBAR DESKTOP (siempre visible) ────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0d0d0d] border-r border-gray-800 fixed inset-y-0 left-0 z-30">
        <SidebarNav userName={userName} />
      </aside>

      {/* ── SIDEBAR MÓVIL (overlay) ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Panel */}
          <aside className="relative w-64 bg-[#0d0d0d] border-r border-gray-800 flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <SidebarNav userName={userName} onCloseMobile={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">

        {/* Topbar móvil */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-4 px-4 h-14 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 transition-all"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🥊</span>
            <span className="font-black text-sm text-white">ACADEMIA ÉLITE</span>
          </div>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}
