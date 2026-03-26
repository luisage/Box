'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPagoVencido, actualizarEstadoAlumno, type AlumnoPagoVencido } from '@/app/actions'

type EstadoFiltro = 'ACTIVO' | 'INACTIVO' | 'BAJA'

const ESTADOS: { value: EstadoFiltro; label: string }[] = [
  { value: 'ACTIVO',   label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'BAJA',     label: 'Baja' },
]

const ESTADO_STYLES: Record<EstadoFiltro, string> = {
  ACTIVO:   'text-green-400 bg-green-900/30 border-green-800',
  INACTIVO: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  BAJA:     'text-red-400 bg-red-900/30 border-red-800',
}

function formatFecha(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function DiasVencidoBadge({ dias }: { dias: number }) {
  const cls =
    dias >= 60 ? 'bg-red-900/40 text-red-400 border-red-800' :
    dias >= 30 ? 'bg-orange-900/40 text-orange-400 border-orange-800' :
                 'bg-yellow-900/40 text-yellow-400 border-yellow-800'
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${cls}`}>
      {dias} {dias === 1 ? 'día' : 'días'}
    </span>
  )
}

export default function PagoVencidoReport() {
  const [filtro,   setFiltro]   = useState<EstadoFiltro>('ACTIVO')
  const [datos,    setDatos]    = useState<AlumnoPagoVencido[]>([])
  const [loading,  setLoading]  = useState(true)
  // Map de id → estado local (para optimistic update)
  const [estados,  setEstados]  = useState<Map<number, EstadoFiltro>>(new Map())
  // Map de id → guardando
  const [saving,   setSaving]   = useState<Set<number>>(new Set())
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)

  const cargar = useCallback(async (f: EstadoFiltro) => {
    setLoading(true)
    const d = await getPagoVencido(f)
    setDatos(d)
    setEstados(new Map(d.map((a) => [a.id, a.estado])))
    setLoading(false)
  }, [])

  useEffect(() => { cargar(filtro) }, [filtro, cargar])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleEstadoChange(alumnoId: number, nuevoEstado: EstadoFiltro) {
    // Optimistic update
    setEstados((prev) => new Map(prev).set(alumnoId, nuevoEstado))
    setSaving((prev) => new Set(prev).add(alumnoId))

    const result = await actualizarEstadoAlumno(alumnoId, nuevoEstado)

    setSaving((prev) => { const s = new Set(prev); s.delete(alumnoId); return s })

    if (result.success) {
      setToast({ msg: 'Estado actualizado.', ok: true })
    } else {
      // Revertir
      setEstados((prev) => new Map(prev).set(alumnoId, datos.find((a) => a.id === alumnoId)!.estado))
      setToast({ msg: result.error ?? 'Error al actualizar.', ok: false })
    }
  }

  return (
    <div>
      {/* Cabecera + filtro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Alumnos con pago vencido</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Alumnos que no han pagado el mes actual
            {!loading && (
              <span className="ml-2 text-yellow-400 font-semibold">· {datos.length} alumno{datos.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">Filtrar por estado:</span>
          <div className="relative">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as EstadoFiltro)}
              className="appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2 text-gray-100 outline-none transition-colors text-sm pr-8 [color-scheme:dark] cursor-pointer"
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
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
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : datos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm">No hay alumnos con pago vencido en estado <span className="text-gray-300">{ESTADOS.find(e => e.value === filtro)?.label}</span></p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Nombre', 'Apellido', 'Mensualidad', 'Días vencido', 'Última asistencia', 'Teléfono', 'Estado'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {datos.map((alumno) => {
                  const estadoActual = estados.get(alumno.id) ?? alumno.estado
                  const guardando    = saving.has(alumno.id)
                  return (
                    <tr key={alumno.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-gray-100 font-medium whitespace-nowrap">{alumno.nombre}</td>
                      <td className="px-5 py-3.5 text-gray-100 whitespace-nowrap">{alumno.apellido}</td>
                      <td className="px-5 py-3.5 text-yellow-400 font-semibold whitespace-nowrap">
                        ${alumno.mensualidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <DiasVencidoBadge dias={alumno.diasVencido} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {alumno.ultimaAsistencia
                          ? formatFecha(alumno.ultimaAsistencia)
                          : <span className="text-gray-600 italic text-xs">Sin asistencias</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {alumno.telefono ?? <span className="text-gray-600 italic text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative">
                          <select
                            value={estadoActual}
                            onChange={(e) => handleEstadoChange(alumno.id, e.target.value as EstadoFiltro)}
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
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
          toast.ok ? 'bg-green-900 border-green-700 text-green-300' : 'bg-red-900 border-red-700 text-red-300'
        }`}>
          {toast.ok
            ? <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            : <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
