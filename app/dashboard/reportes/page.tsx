'use client'

import { useState } from 'react'
import AlumnosNuevosChart from './AlumnosNuevosChart'
import IngresoMensualChart from './IngresoMensualChart'
import AsistenciaChart from './AsistenciaChart'
import PagoVencidoReport from './PagoVencidoReport'

type ReporteKey = '' | 'alumnos-nuevos' | 'ingreso-mensual' | 'asistencia' | 'pago-vencido'

const REPORTES: { value: ReporteKey; label: string }[] = [
  { value: '',              label: 'Selecciona un reporte' },
  { value: 'alumnos-nuevos', label: 'Alumnos nuevos' },
  { value: 'ingreso-mensual', label: 'Ingreso mensual' },
  { value: 'asistencia',     label: 'Asistencia' },
  { value: 'pago-vencido',   label: 'Alumnos con pago vencido' },
]

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteKey>('')

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Reportes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visualiza estadísticas del gimnasio</p>
      </div>

      {/* Selector de reporte */}
      <div className="mb-8 max-w-xs">
        <label htmlFor="select-reporte" className="block text-sm font-medium text-gray-400 mb-2">
          Tipo de reporte
        </label>
        <div className="relative">
          <select
            id="select-reporte"
            value={reporte}
            onChange={(e) => setReporte(e.target.value as ReporteKey)}
            className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-10 [color-scheme:dark] cursor-pointer"
          >
            {REPORTES.map((r) => (
              <option key={r.value} value={r.value} disabled={r.value === ''}>
                {r.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Contenido del reporte */}
      {reporte === '' && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <svg className="w-14 h-14 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-gray-500 text-sm">Selecciona un reporte para visualizarlo</p>
        </div>
      )}

      {reporte === 'alumnos-nuevos' && <AlumnosNuevosChart />}

      {reporte === 'ingreso-mensual' && <IngresoMensualChart />}

      {reporte === 'asistencia' && <AsistenciaChart />}

      {reporte === 'pago-vencido' && <PagoVencidoReport />}
    </div>
  )
}
