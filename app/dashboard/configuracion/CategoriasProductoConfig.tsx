'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCategorias, crearCategoria, actualizarCategoria } from '@/app/actions'

type CategoriaRow = { id: number; nombre: string; estatus: boolean }

interface ModalProps {
  categoria?: CategoriaRow
  onClose:    () => void
  onSuccess:  (msg: string) => void
}

function CategoriaModal({ categoria, onClose, onSuccess }: ModalProps) {
  const esEdicion = !!categoria
  const [nombre,  setNombre]  = useState(categoria?.nombre  ?? '')
  const [estatus, setEstatus] = useState(categoria?.estatus ?? true)
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    if (esEdicion) fd.set('id', String(categoria!.id))
    fd.set('nombre',  nombre)
    fd.set('estatus', String(estatus))

    const result = esEdicion ? await actualizarCategoria(fd) : await crearCategoria(fd)

    if (result.success) {
      onSuccess(esEdicion ? 'Categoría actualizada correctamente.' : 'Categoría agregada correctamente.')
    } else {
      setError(result.error ?? 'Error desconocido.')
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-base">
              {esEdicion ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            {esEdicion && (
              <p className="text-gray-400 text-sm mt-0.5">{categoria!.nombre}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none mt-0.5" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="cat-nombre" className="block text-sm font-medium text-gray-300">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-nombre"
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError('') }}
              required
              autoFocus
              placeholder="Ej: Guantes de boxeo"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
            />
          </div>

          {/* Estatus */}
          <div className="space-y-1.5">
            <label htmlFor="cat-estatus" className="block text-sm font-medium text-gray-300">Estatus</label>
            <div className="relative">
              <select
                id="cat-estatus"
                value={String(estatus)}
                onChange={(e) => setEstatus(e.target.value === 'true')}
                className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-9 [color-scheme:dark] cursor-pointer"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {pending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando…
                </>
              ) : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriasProductoConfig() {
  const [categorias,  setCategorias]  = useState<CategoriaRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editando,    setEditando]    = useState<CategoriaRow | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const data = await getCategorias()
    setCategorias(data as CategoriaRow[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function handleSuccess(msg: string) {
    setModalOpen(false)
    setEditando(null)
    setToast(msg)
    cargar()
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Categorías de producto</h2>
          <p className="text-gray-500 text-sm mt-0.5">Administra las categorías para clasificar los productos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-gray-500 text-sm">No hay categorías registradas</p>
          <button onClick={() => setModalOpen(true)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
            Agregar la primera categoría
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Nombre', 'Estatus', ''].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-100 font-medium">{cat.nombre}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      cat.estatus
                        ? 'bg-green-900/30 text-green-400 border-green-800'
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.estatus ? 'bg-green-400' : 'bg-gray-500'}`} />
                      {cat.estatus ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setEditando(cat)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                      aria-label="Editar"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CategoriaModal onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />
      )}
      {editando && (
        <CategoriaModal categoria={editando} onClose={() => setEditando(null)} onSuccess={handleSuccess} />
      )}

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
