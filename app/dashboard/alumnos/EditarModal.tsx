'use client'

import { useState, useEffect } from 'react'
import { actualizarAlumno } from '@/app/actions'

export interface EditarAlumnoData {
  id:              number
  nombre:          string
  apellido:        string
  fechaNacimiento: string  // ISO string
  telefono:        string | null
  mensualidad:     number
}

interface Props {
  alumno:    EditarAlumnoData
  onClose:   () => void
  onSuccess: () => void
}

export default function EditarModal({ alumno, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState({
    nombre:          alumno.nombre,
    apellido:        alumno.apellido,
    fechaNacimiento: alumno.fechaNacimiento.slice(0, 10), // YYYY-MM-DD
    telefono:        alumno.telefono ?? '',
    mensualidad:     String(alumno.mensualidad),
  })
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    fd.set('alumnoId',        String(alumno.id))
    fd.set('nombre',          fields.nombre)
    fd.set('apellido',        fields.apellido)
    fd.set('fechaNacimiento', fields.fechaNacimiento)
    fd.set('telefono',        fields.telefono)
    fd.set('mensualidad',     fields.mensualidad)

    const result = await actualizarAlumno(fd)

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
            <h2 className="text-white font-bold text-base">Editar Alumno</h2>
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

          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-300">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-nombre"
                name="nombre"
                type="text"
                value={fields.nombre}
                onChange={handleChange}
                required
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-apellido" className="block text-sm font-medium text-gray-300">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-apellido"
                name="apellido"
                type="text"
                value={fields.apellido}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Fecha de nacimiento + Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-fecha" className="block text-sm font-medium text-gray-300">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-fecha"
                name="fechaNacimiento"
                type="date"
                value={fields.fechaNacimiento}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-telefono" className="block text-sm font-medium text-gray-300">
                Teléfono
                <span className="ml-1 text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                id="edit-telefono"
                name="telefono"
                type="tel"
                value={fields.telefono}
                onChange={handleChange}
                placeholder="—"
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Mensualidad */}
          <div className="space-y-1.5">
            <label htmlFor="edit-mensualidad" className="block text-sm font-medium text-gray-300">
              Mensualidad <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">$</span>
              <input
                id="edit-mensualidad"
                name="mensualidad"
                type="number"
                min="1"
                step="0.01"
                value={fields.mensualidad}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl pl-8 pr-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
              />
            </div>
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

          {/* Botones */}
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
                  Actualizando…
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
