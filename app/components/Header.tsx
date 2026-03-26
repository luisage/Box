'use client'

import { useState } from 'react'
import LoginModal from '@/app/components/LoginModal'

export default function Header() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo + Nombre */}
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">🥊</span>
              <div className="leading-tight">
                <p className="font-black text-lg sm:text-xl text-white tracking-tight">
                  ACADEMIA ÉLITE
                </p>
                <p className="hidden sm:block text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase">
                  Escuela de Box
                </p>
              </div>
            </div>

            {/* Navegación escritorio + íconos */}
            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                <a href="#info" className="hover:text-white transition-colors">Horarios</a>
                <a href="#novedades" className="hover:text-white transition-colors">Novedades</a>
                <a href="#productos" className="hover:text-white transition-colors">Productos</a>
                <a href="#resenas" className="hover:text-white transition-colors">Reseñas</a>
                <a
                  href="#escribe-resena"
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl transition-colors font-semibold"
                >
                  Únete
                </a>
              </nav>

              {/* Botón móvil Únete */}
              <a
                href="#escribe-resena"
                className="md:hidden bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Únete
              </a>

              {/* Ícono de login — visible en todos los tamaños */}
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-700 hover:border-red-600 hover:bg-red-600/10 text-gray-400 hover:text-red-400 transition-all"
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
