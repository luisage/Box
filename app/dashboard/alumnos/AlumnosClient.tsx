'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { registrarAsistencia } from '@/app/actions'
import PagoModal from '@/app/dashboard/alumnos/PagoModal'
import DatosExtrasModal, { type DatosExtrasAlumno } from '@/app/dashboard/alumnos/DatosExtrasModal'
import EditarModal, { type EditarAlumnoData } from '@/app/dashboard/alumnos/EditarModal'
import ProgresoModal from '@/app/dashboard/alumnos/ProgresoModal'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AlumnoRow = {
  id: number
  nombre: string
  apellido: string
  telefono: string | null
  fechaInscripcion: string
  fechaNacimiento: string
  mensualidad: number
  ultimoPagoEstado: string | null
  asistenciaHoy: boolean
  // Datos extras
  nivel: string
  pesoKg: number | null
  categoriaPeso: string | null
  turno: string
  estado: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularEdad(fechaNacISO: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacISO)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatFecha(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Badge de estado de pago ───────────────────────────────────────────────────

const PAGO_CONFIG: Record<string, { label: string; className: string }> = {
  PAGADO:    { label: 'Pagado',    className: 'bg-green-900/40 text-green-400 border border-green-800' },
  ABONO:     { label: 'Abono',     className: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' },
  PENDIENTE: { label: 'Pendiente', className: 'bg-orange-900/40 text-orange-400 border border-orange-800' },
  VENCIDO:   { label: 'Vencido',   className: 'bg-red-900/40 text-red-400 border border-red-800' },
}

function PagoBadge({ estado }: { estado: string | null }) {
  if (!estado) {
    return <span className="text-xs text-gray-500 italic">Sin pago registrado</span>
  }
  const cfg = PAGO_CONFIG[estado] ?? {
    label: estado,
    className: 'bg-gray-800 text-gray-400 border border-gray-700',
  }
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ── Menú de 3 puntos ──────────────────────────────────────────────────────────

type MenuPos = { top: number; right: number }

const ACCIONES = [
  {
    key: 'editar',
    label: 'Editar',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
      </svg>
    ),
  },
  {
    key: 'datos',
    label: 'Datos extras',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    key: 'pago',
    label: 'Registrar pago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
      </svg>
    ),
  },
  {
    key: 'progreso',
    label: 'Registrar progreso',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

// ── Toast de éxito ────────────────────────────────────────────────────────────

type ToastState = { msg: string; ok: boolean } | null

function Toast({ toast, onDismiss }: { toast: NonNullable<ToastState>; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const ok = toast.ok
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl border whitespace-nowrap ${
      ok
        ? 'bg-green-900 border-green-700 text-green-300'
        : 'bg-red-900 border-red-700 text-red-300'
    }`}>
      {ok ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      {toast.msg}
      <button onClick={onDismiss} className={`ml-1 transition-colors ${ok ? 'text-green-400 hover:text-green-200' : 'text-red-400 hover:text-red-200'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AlumnosClient({ alumnos }: { alumnos: AlumnoRow[] }) {
  const router = useRouter()

  const [query,       setQuery]       = useState('')
  const [openId,      setOpenId]      = useState<number | null>(null)
  const [menuPos,     setMenuPos]     = useState<MenuPos>({ top: 0, right: 0 })
  const [pagoAlumno,   setPagoAlumno]   = useState<AlumnoRow | null>(null)
  const [datosAlumno,  setDatosAlumno]  = useState<DatosExtrasAlumno | null>(null)
  const [editarAlumno,   setEditarAlumno]   = useState<EditarAlumnoData | null>(null)
  const [progresoAlumno, setProgresoAlumno] = useState<AlumnoRow | null>(null)
  const [toast,        setToast]        = useState<ToastState>(null)
  // Asistencias: Set de IDs con asistencia hoy (DB + optimistas) y Set de IDs cargando
  const [asistenciasHoy, setAsistenciasHoy] = useState<Set<number>>(
    () => new Set(alumnos.filter((a) => a.asistenciaHoy).map((a) => a.id))
  )
  const [loadingAsistencia, setLoadingAsistencia] = useState<Set<number>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    if (openId === null) return
    const handler = () => setOpenId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openId])

  // Abre el menú con posición fixed
  const handleOpenMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
      setOpenId((prev) => (prev === id ? null : id))
    },
    []
  )

  // Maneja la selección de una acción del menú
  function handleAccion(key: string) {
    const alumno = alumnos.find((a) => a.id === openId)
    if (alumno) {
      if (key === 'editar')   setEditarAlumno(alumno)
      if (key === 'datos')    setDatosAlumno(alumno)
      if (key === 'pago')     setPagoAlumno(alumno)
      if (key === 'progreso') setProgresoAlumno(alumno)
    }
    setOpenId(null)
  }

  // Callbacks de éxito de modales
  function handlePagoSuccess() {
    setPagoAlumno(null)
    setToast({ msg: 'Pago registrado exitosamente.', ok: true })
    router.refresh()
  }

  function handleDatosSuccess() {
    setDatosAlumno(null)
    setToast({ msg: 'Datos guardados correctamente.', ok: true })
    router.refresh()
  }

  function handleEditarSuccess() {
    setEditarAlumno(null)
    setToast({ msg: 'Datos actualizados correctamente.', ok: true })
    router.refresh()
  }

  function handleProgresoSuccess() {
    setProgresoAlumno(null)
    setToast({ msg: 'Progreso guardado correctamente.', ok: true })
  }

  async function handleAsistencia(alumnoId: number) {
    if (asistenciasHoy.has(alumnoId) || loadingAsistencia.has(alumnoId)) return

    // Optimista: marcar cargando
    setLoadingAsistencia((prev) => new Set(prev).add(alumnoId))

    const result = await registrarAsistencia(alumnoId)

    setLoadingAsistencia((prev) => { const s = new Set(prev); s.delete(alumnoId); return s })

    if (result.success) {
      setAsistenciasHoy((prev) => new Set(prev).add(alumnoId))
      setToast({ msg: 'Asistencia registrada.', ok: true })
    } else {
      setToast({ msg: result.error ?? 'Error al registrar asistencia.', ok: false })
    }
  }

  // Filtrado desde el 3er carácter
  const filtered =
    query.length >= 3
      ? alumnos.filter((a) => {
          const q = query.toLowerCase()
          return (
            `${a.nombre} ${a.apellido}`.toLowerCase().includes(q) ||
            (a.telefono ?? '').includes(q)
          )
        })
      : alumnos

  return (
    <div>

      {/* ── Barra superior: título + buscador ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Alumnos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} registrado{alumnos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl pl-9 pr-9 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); searchRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hints del buscador */}
      {query.length > 0 && query.length < 3 && (
        <p className="text-xs text-gray-600 mb-4 -mt-2">Escribe al menos 3 caracteres para buscar…</p>
      )}
      {query.length >= 3 && (
        <p className="text-xs text-gray-600 mb-4 -mt-2">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
        </p>
      )}

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-16 text-center">
          <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-gray-500 text-sm">No se encontraron alumnos.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pl-4 pr-2 py-3.5 w-10" title="Asistencia de hoy">
                    <svg className="w-4 h-4 text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </th>
                  {['Nombre', 'Apellido', 'F. Registro', 'Edad', 'Mensualidad', 'Estado pago', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((alumno) => (
                  <tr key={alumno.id} className="hover:bg-gray-800/40 transition-colors group">
                    {/* Ícono de asistencia */}
                    <td className="pl-4 pr-2 py-3.5 text-center">
                      {loadingAsistencia.has(alumno.id) ? (
                        <svg className="w-5 h-5 text-gray-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : asistenciasHoy.has(alumno.id) ? (
                        <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <button
                          onClick={() => handleAsistencia(alumno.id)}
                          title="Registrar asistencia"
                          className="group/btn mx-auto flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 text-gray-600 group-hover/btn:text-gray-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 1.5a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-100 font-medium whitespace-nowrap">{alumno.nombre}</td>
                    <td className="px-5 py-3.5 text-gray-100 whitespace-nowrap">{alumno.apellido}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatFecha(alumno.fechaInscripcion)}</td>
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">{calcularEdad(alumno.fechaNacimiento)} años</td>
                    <td className="px-5 py-3.5 text-yellow-400 font-semibold whitespace-nowrap">
                      ${alumno.mensualidad.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <PagoBadge estado={alumno.ultimoPagoEstado} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => handleOpenMenu(e, alumno.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Acciones"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dropdown menú ────────────────────────────────────────────────────── */}
      {openId !== null && (
        <div
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-50 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {ACCIONES.map((accion, i) => (
            <button
              key={accion.key}
              onClick={() => handleAccion(accion.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left ${
                i < ACCIONES.length - 1 ? 'border-b border-gray-800' : ''
              }`}
            >
              <span className="text-gray-500">{accion.icon}</span>
              {accion.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Modal de pago ────────────────────────────────────────────────────── */}
      {pagoAlumno && (
        <PagoModal
          alumno={pagoAlumno}
          onClose={() => setPagoAlumno(null)}
          onSuccess={handlePagoSuccess}
        />
      )}

      {/* ── Modal de datos extras ─────────────────────────────────────────────── */}
      {datosAlumno && (
        <DatosExtrasModal
          alumno={datosAlumno}
          onClose={() => setDatosAlumno(null)}
          onSuccess={handleDatosSuccess}
        />
      )}

      {/* ── Modal de editar ───────────────────────────────────────────────────── */}
      {editarAlumno && (
        <EditarModal
          alumno={editarAlumno}
          onClose={() => setEditarAlumno(null)}
          onSuccess={handleEditarSuccess}
        />
      )}

      {/* ── Modal de progreso ─────────────────────────────────────────────────── */}
      {progresoAlumno && (
        <ProgresoModal
          alumnoId={progresoAlumno.id}
          alumnoNombre={progresoAlumno.nombre}
          alumnoApellido={progresoAlumno.apellido}
          onClose={() => setProgresoAlumno(null)}
          onSuccess={handleProgresoSuccess}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      )}

    </div>
  )
}
