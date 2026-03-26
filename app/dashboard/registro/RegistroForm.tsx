'use client'

import { useState } from 'react'
import { registrarAlumno } from '@/app/actions'

const initialState = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  telefono: '',
  mensualidad: '',
}

type Status = { type: 'success' | 'error'; message: string } | null

export default function RegistroForm() {
  const [fields, setFields]   = useState(initialState)
  const [pending, setPending] = useState(false)
  const [status,  setStatus]  = useState<Status>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (status) setStatus(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setStatus(null)

    const formData = new FormData()
    Object.entries(fields).forEach(([k, v]) => formData.set(k, v))

    const result = await registrarAlumno(formData)

    if (result.success) {
      setStatus({ type: 'success', message: '¡Alumno registrado exitosamente!' })
      setFields(initialState)
    } else {
      setStatus({ type: 'error', message: result.error ?? 'Error desconocido.' })
    }

    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Nombre */}
        <div className="space-y-1.5">
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-300">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={fields.nombre}
            onChange={handleChange}
            placeholder="Ej. Juan"
            required
            className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
          />
        </div>

        {/* Apellido */}
        <div className="space-y-1.5">
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-300">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            value={fields.apellido}
            onChange={handleChange}
            placeholder="Ej. García"
            required
            className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className="space-y-1.5">
          <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-300">
            Fecha de nacimiento <span className="text-red-500">*</span>
          </label>
          <input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            value={fields.fechaNacimiento}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm [color-scheme:dark]"
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-300">
            Teléfono
            <span className="ml-1.5 text-xs text-gray-500 font-normal">(opcional)</span>
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={fields.telefono}
            onChange={handleChange}
            placeholder="Ej. 5512345678"
            className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
          />
        </div>

        {/* Mensualidad */}
        <div className="space-y-1.5 md:col-span-2 md:max-w-xs">
          <label htmlFor="mensualidad" className="block text-sm font-medium text-gray-300">
            Mensualidad <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">$</span>
            <input
              id="mensualidad"
              name="mensualidad"
              type="number"
              min="1"
              step="0.01"
              value={fields.mensualidad}
              onChange={handleChange}
              placeholder="0.00"
              required
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl pl-8 pr-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
            />
          </div>
        </div>

      </div>

      {/* Mensaje de estado */}
      {status && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
            status.type === 'success'
              ? 'bg-green-900/30 border-green-700 text-green-400'
              : 'bg-red-900/30 border-red-700 text-red-400'
          }`}
        >
          {status.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {status.message}
        </div>
      )}

      {/* Botón guardar */}
      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-7 py-2.5 rounded-xl transition-colors text-sm"
        >
          {pending ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Guardar
            </>
          )}
        </button>
      </div>
    </form>
  )
}
