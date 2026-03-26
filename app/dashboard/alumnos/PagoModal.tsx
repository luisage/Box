'use client'

import { useState, useEffect } from 'react'
import { registrarPago } from '@/app/actions'

interface Props {
  alumno: { id: number; nombre: string; apellido: string; mensualidad: number }
  onClose: () => void
  onSuccess: () => void
}

const hoy = () => new Date().toISOString().split('T')[0]
const mesActual = () => new Date().toISOString().slice(0, 7)

const METODOS = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA',       label: 'Tarjeta' },
]

export default function PagoModal({ alumno, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState({
    monto:             '',
    metodoPago:        'EFECTIVO',
    mesCorrespondiente: mesActual(),
    fechaPago:          hoy(),
    notas:              '',
  })
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  // Cierra con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    fd.set('alumnoId',         String(alumno.id))
    fd.set('monto',            fields.monto)
    fd.set('metodoPago',       fields.metodoPago)
    fd.set('mesCorrespondiente', fields.mesCorrespondiente)
    fd.set('fechaPago',        fields.fechaPago)
    fd.set('notas',            fields.notas)

    const result = await registrarPago(fd)

    if (result.success) {
      onSuccess()
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
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-base">Registrar Pago</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {alumno.nombre} {alumno.apellido}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none mt-0.5"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Monto */}
          <div className="space-y-1.5">
            <label htmlFor="monto" className="block text-sm font-medium text-gray-300">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">$</span>
              <input
                id="monto"
                name="monto"
                type="number"
                min="1"
                step="1"
                value={fields.monto}
                onChange={handleChange}
                placeholder="0"
                required
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl pl-8 pr-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
            <p className="text-xs text-gray-600">
              Mensualidad: ${alumno.mensualidad.toLocaleString('es-MX')} —{' '}
              {fields.monto && parseInt(fields.monto) > 0
                ? parseInt(fields.monto) >= alumno.mensualidad
                  ? <span className="text-green-500">se registrará como Pagado</span>
                  : <span className="text-yellow-500">se registrará como Abono</span>
                : 'ingresa el monto para ver el estado'}
            </p>
          </div>

          {/* Método de pago */}
          <div className="space-y-1.5">
            <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-300">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <select
              id="metodoPago"
              name="metodoPago"
              value={fields.metodoPago}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
            >
              {METODOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Mes correspondiente + Fecha de registro */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="mesCorrespondiente" className="block text-sm font-medium text-gray-300">
                Mes correspondiente <span className="text-red-500">*</span>
              </label>
              <input
                id="mesCorrespondiente"
                name="mesCorrespondiente"
                type="month"
                value={fields.mesCorrespondiente}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-300">
                Fecha de registro <span className="text-red-500">*</span>
              </label>
              <input
                id="fechaPago"
                name="fechaPago"
                type="date"
                value={fields.fechaPago}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label htmlFor="notas" className="block text-sm font-medium text-gray-300">
              Notas
              <span className="ml-1.5 text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              value={fields.notas}
              onChange={handleChange}
              placeholder="Observaciones sobre el pago…"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
            >
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
                  Registrando…
                </>
              ) : (
                'Registrar'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
