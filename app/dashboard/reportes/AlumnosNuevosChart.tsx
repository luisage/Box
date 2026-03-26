'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getAlumnosNuevos } from '@/app/actions'

type Punto = { label: string; total: number }

export default function AlumnosNuevosChart() {
  const [modo,    setModo]    = useState<'semana' | 'mes'>('mes')
  const [datos,   setDatos]   = useState<Punto[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async (m: 'semana' | 'mes') => {
    setLoading(true)
    const d = await getAlumnosNuevos(m)
    setDatos(d)
    setLoading(false)
  }, [])

  useEffect(() => { cargar(modo) }, [modo, cargar])

  const total = datos.reduce((s, d) => s + d.total, 0)
  const max   = Math.max(...datos.map((d) => d.total), 1)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Alumnos nuevos</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {modo === 'semana' ? 'Últimos 7 días' : 'Últimos 12 meses'}
            {!loading && (
              <span className="ml-2 text-yellow-400 font-semibold">
                · {total} en total
              </span>
            )}
          </p>
        </div>

        {/* Toggle semana / mes */}
        <div className="inline-flex bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
          {(['semana', 'mes'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                modo === m
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {m === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfica */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-gray-500 text-sm">Sin registros en este período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={datos} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#f9fafb',
                fontSize: 13,
              }}
              formatter={(value) => [value, 'Alumnos nuevos']}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {datos.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.total === max && entry.total > 0 ? '#dc2626' : '#374151'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
