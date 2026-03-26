'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getIngresoMensual } from '@/app/actions'

type Punto = { label: string; total: number }

function formatPeso(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return `$${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        ${payload[0].value.toLocaleString('es-MX')}
      </p>
    </div>
  )
}

export default function IngresoMensualChart() {
  const [modo,    setModo]    = useState<'semana' | 'mes'>('mes')
  const [datos,   setDatos]   = useState<Punto[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async (m: 'semana' | 'mes') => {
    setLoading(true)
    const d = await getIngresoMensual(m)
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
          <h2 className="text-white font-bold text-lg">Ingreso mensual</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {modo === 'semana' ? 'Últimas 4 semanas' : 'Últimos 12 meses'}
            {!loading && (
              <span className="ml-2 text-yellow-400 font-semibold">
                · ${total.toLocaleString('es-MX')} en total
              </span>
            )}
          </p>
        </div>

        {/* Toggle */}
        <div className="inline-flex bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
          {(['semana', 'mes'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

      {/* KPI */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {datos.map((d) => (
            <div
              key={d.label}
              className={`rounded-xl px-4 py-3 border ${
                d.total === max && d.total > 0
                  ? 'bg-red-950/40 border-red-800'
                  : 'bg-gray-800/60 border-gray-700'
              }`}
            >
              <p className="text-gray-400 text-xs truncate">{d.label}</p>
              <p className={`font-bold text-base mt-0.5 ${d.total === max && d.total > 0 ? 'text-red-400' : 'text-white'}`}>
                ${d.total.toLocaleString('es-MX')}
              </p>
            </div>
          ))}
        </div>
      )}

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
          </svg>
          <p className="text-gray-500 text-sm">Sin ingresos registrados en este período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={datos} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatPeso}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#dc2626"
              strokeWidth={2.5}
              fill="url(#colorIngreso)"
              dot={{ fill: '#dc2626', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#ef4444', r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
