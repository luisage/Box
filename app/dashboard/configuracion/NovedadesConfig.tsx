'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNovedades } from '@/app/actions'
import NovedadModal, { type NovedadData } from './NovedadModal'

export default function NovedadesConfig() {
  const [filtro,     setFiltro]     = useState<boolean>(true)          // true = activas
  const [novedades,  setNovedades]  = useState<NovedadData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editando,   setEditando]   = useState<NovedadData | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)

  const cargar = useCallback(async (f: boolean) => {
    setLoading(true)
    const data = await getNovedades(f)
    setNovedades(data as NovedadData[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar(filtro) }, [filtro, cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // Cierra menú al hacer clic fuera
  useEffect(() => {
    if (openMenuId === null) return
    const handler = () => setOpenMenuId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenuId])

  function handleSuccess(msg: string) {
    setModalOpen(false)
    setEditando(null)
    setToast(msg)
    cargar(filtro)
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Novedades</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Administra las novedades que se muestran en el inicio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro activas / inactivas */}
          <div className="relative">
            <select
              value={String(filtro)}
              onChange={(e) => setFiltro(e.target.value === 'true')}
              className="appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2 text-gray-100 outline-none transition-colors text-sm pr-8 [color-scheme:dark] cursor-pointer"
            >
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Botón agregar */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            title="Agregar novedad"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : novedades.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <p className="text-gray-500 text-sm">No hay novedades {filtro ? 'activas' : 'inactivas'}</p>
          {filtro && (
            <button onClick={() => setModalOpen(true)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
              Agregar la primera novedad
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Título', 'Descripción', 'Vigencia', 'Estatus', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {novedades.map((nov) => (
                  <tr key={nov.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-gray-100 font-medium max-w-[180px]">
                      <span className="line-clamp-2">{nov.titulo}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 max-w-[280px]">
                      <span className="line-clamp-2">{nov.descripcion}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {nov.vigencia ?? <span className="text-gray-600 italic text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        nov.estatus
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${nov.estatus ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {nov.estatus ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === nov.id ? null : nov.id)
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                          aria-label="Acciones"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                          </svg>
                        </button>

                        {openMenuId === nov.id && (
                          <div
                            className="absolute right-0 top-8 z-20 w-36 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setEditando(nov)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal agregar */}
      {modalOpen && (
        <NovedadModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal editar */}
      {editando && (
        <NovedadModal
          novedad={editando}
          onClose={() => setEditando(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl border bg-green-900 border-green-700 text-green-300 whitespace-nowrap">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  )
}
