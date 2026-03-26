'use client'

import { useState, useEffect, useCallback } from 'react'
import { getResenas, actualizarEstadoResena, type EstadoResenaFiltro } from '@/app/actions'

type EstadoResena = 'PENDIENTE' | 'VISIBLE' | 'OCULTA'

type ResenaRow = {
  id:          number
  comentario:  string
  fecha:       Date
  calificacion: number
  estado:      EstadoResena
}

const FILTROS: { value: EstadoResenaFiltro; label: string }[] = [
  { value: 'TODOS',     label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VISIBLE',   label: 'Visible' },
  { value: 'OCULTA',    label: 'Oculta' },
]

const ESTADOS: { value: EstadoResena; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VISIBLE',   label: 'Visible' },
  { value: 'OCULTA',    label: 'Oculta' },
]

const ESTADO_STYLES: Record<EstadoResena, string> = {
  PENDIENTE: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  VISIBLE:   'text-green-400  bg-green-900/30  border-green-800',
  OCULTA:    'text-gray-400   bg-gray-800      border-gray-700',
}

function Estrellas({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < n ? 'text-yellow-400' : 'text-gray-700'}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function ResenasConfig() {
  const [filtro,    setFiltro]    = useState<EstadoResenaFiltro>('TODOS')
  const [resenas,   setResenas]   = useState<ResenaRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [estados,   setEstados]   = useState<Map<number, EstadoResena>>(new Map())
  const [saving,    setSaving]    = useState<Set<number>>(new Set())
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const cargar = useCallback(async (f: EstadoResenaFiltro) => {
    setLoading(true)
    const data = await getResenas(f)
    setResenas(data as ResenaRow[])
    setEstados(new Map(data.map((r) => [r.id, r.estado as EstadoResena])))
    setLoading(false)
  }, [])

  useEffect(() => { cargar(filtro) }, [filtro, cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleEstadoChange(id: number, nuevoEstado: EstadoResena) {
    setEstados((prev) => new Map(prev).set(id, nuevoEstado))
    setSaving((prev) => new Set(prev).add(id))

    const result = await actualizarEstadoResena(id, nuevoEstado)

    setSaving((prev) => { const s = new Set(prev); s.delete(id); return s })

    if (result.success) {
      setToast({ msg: 'Reseña actualizada correctamente.', ok: true })
    } else {
      // revertir
      const original = resenas.find((r) => r.id === id)?.estado as EstadoResena
      setEstados((prev) => new Map(prev).set(id, original))
      setToast({ msg: result.error ?? 'Error al actualizar.', ok: false })
    }
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Reseñas</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Modera las reseñas enviadas por los alumnos
            {!loading && (
              <span className="ml-2 text-gray-400">· {resenas.length} resultado{resenas.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">Estado:</span>
          <div className="relative">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as EstadoResenaFiltro)}
              className="appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2 text-gray-100 outline-none transition-colors text-sm pr-8 [color-scheme:dark] cursor-pointer"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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
      ) : resenas.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <p className="text-gray-500 text-sm">
            No hay reseñas {filtro !== 'TODOS' ? `con estado "${FILTROS.find(f => f.value === filtro)?.label}"` : ''}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Comentario', 'Fecha', 'Calificación', 'Estado'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {resenas.map((r) => {
                  const estadoActual = estados.get(r.id) ?? r.estado
                  const guardando   = saving.has(r.id)
                  const fecha = new Date(r.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })

                  return (
                    <tr key={r.id} className="hover:bg-gray-800/40 transition-colors align-top">
                      <td className="px-5 py-3.5 text-gray-300 max-w-[360px]">
                        <p className="line-clamp-3 leading-relaxed">{r.comentario}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{fecha}</td>
                      <td className="px-5 py-3.5">
                        <Estrellas n={r.calificacion} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative inline-block">
                          <select
                            value={estadoActual}
                            onChange={(e) => handleEstadoChange(r.id, e.target.value as EstadoResena)}
                            disabled={guardando}
                            className={`appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-full border outline-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark] ${ESTADO_STYLES[estadoActual]}`}
                          >
                            {ESTADOS.map((e) => (
                              <option key={e.value} value={e.value} className="bg-gray-900 text-gray-100">
                                {e.label}
                              </option>
                            ))}
                          </select>
                          {guardando ? (
                            <svg className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl border whitespace-nowrap ${
          toast.ok
            ? 'bg-green-900 border-green-700 text-green-300'
            : 'bg-red-900  border-red-700  text-red-300'
        }`}>
          {toast.ok
            ? <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            : <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
