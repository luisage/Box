'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getReporteAsistencia } from '@/app/actions'

type Punto = { label: string; total: number }
type PorDia = { dias: number; alumnos: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value} asistencias</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

export default function AsistenciaChart() {
  const [modo,     setModo]     = useState<'semana' | 'mes'>('semana')
  const [porDias,  setPorDias]  = useState<PorDia[]>([])
  const [porFecha, setPorFecha] = useState<Punto[]>([])
  const [loading,  setLoading]  = useState(true)

  const cargar = useCallback(async (m: 'semana' | 'mes') => {
    setLoading(true)
    const d = await getReporteAsistencia(m)
    setPorDias(d.porDias)
    setPorFecha(d.porFecha)
    setLoading(false)
  }, [])

  useEffect(() => { cargar(modo) }, [modo, cargar])

  const totalAsistencias = porFecha.reduce((s, d) => s + d.total, 0)
  const maxTotal         = Math.max(...porFecha.map((d) => d.total), 1)
  const periodo          = modo === 'semana' ? 'últimos 7 días' : 'últimos 30 días'

  return (
    <div className="space-y-6">

      {/* Cabecera + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">Asistencia</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {modo === 'semana' ? 'Últimos 7 días' : 'Últimos 30 días'}
            {!loading && totalAsistencias > 0 && (
              <span className="ml-2 text-yellow-400 font-semibold">
                · {totalAsistencias} asistencias en total
              </span>
            )}
          </p>
        </div>
        <div className="inline-flex bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
          {(['semana', 'mes'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                modo === m ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {m === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sección 1: tabla por días asistidos ─────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Alumnos por días asistidos</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Cuántos alumnos asistieron determinado número de días en los {periodo}
          </p>
        </div>

        {loading ? (
          <Spinner />
        ) : porDias.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            Sin asistencias registradas en este período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                    Días asistidos
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                    Alumnos
                  </th>
                  <th className="px-6 py-3">
                    {/* barra visual */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {porDias.map((row) => {
                  const maxAlumnos = Math.max(...porDias.map((r) => r.alumnos))
                  const pct = Math.round((row.alumnos / maxAlumnos) * 100)
                  return (
                    <tr key={row.dias} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3.5 text-gray-100 font-medium">
                        {row.dias} {row.dias === 1 ? 'día' : 'días'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-white font-semibold">{row.alumnos}</span>
                          <span className="text-gray-500">
                            {row.alumnos === 1 ? 'alumno' : 'alumnos'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 w-48">
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sección 2: gráfica por fecha ────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-white font-semibold text-sm">Asistencias por día</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Total de registros de asistencia por día en los {periodo}
          </p>
        </div>

        {loading ? (
          <Spinner />
        ) : totalAsistencias === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2">
            <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <p className="text-gray-500 text-sm">Sin asistencias en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={porFecha}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={modo === 'mes' ? 4 : 0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="total" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {porFecha.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.total === maxTotal && entry.total > 0 ? '#dc2626' : '#374151'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
