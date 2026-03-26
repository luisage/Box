'use client'

import { useState, useEffect } from 'react'
import { crearNovedad, actualizarNovedad } from '@/app/actions'

export interface NovedadData {
  id:          number
  titulo:      string
  descripcion: string
  vigencia:    string | null
  estatus:     boolean
}

interface Props {
  novedad?:  NovedadData        // undefined = modo crear
  onClose:   () => void
  onSuccess: (msg: string) => void
}

export default function NovedadModal({ novedad, onClose, onSuccess }: Props) {
  const esEdicion = !!novedad

  const [fields, setFields] = useState({
    titulo:      novedad?.titulo      ?? '',
    descripcion: novedad?.descripcion ?? '',
    vigencia:    novedad?.vigencia    ?? '',
    estatus:     novedad?.estatus     ?? true,
  })
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFields((prev) => ({
      ...prev,
      [name]: name === 'estatus' ? value === 'true' : value,
    }))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    if (esEdicion) fd.set('id', String(novedad!.id))
    fd.set('titulo',      fields.titulo)
    fd.set('descripcion', fields.descripcion)
    fd.set('vigencia',    fields.vigencia)
    fd.set('estatus',     String(fields.estatus))

    const result = esEdicion ? await actualizarNovedad(fd) : await crearNovedad(fd)

    if (result.success) {
      onSuccess(esEdicion ? 'Novedad actualizada correctamente.' : 'Novedad agregada correctamente.')
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
      <div className="w-full max-w-lg bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-base">
              {esEdicion ? 'Editar novedad' : 'Nueva novedad'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {esEdicion ? novedad!.titulo : 'Completa los campos para agregar'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none mt-0.5" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="nov-titulo" className="block text-sm font-medium text-gray-300">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="nov-titulo"
              name="titulo"
              type="text"
              value={fields.titulo}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Ej: Nuevo horario de verano"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label htmlFor="nov-descripcion" className="block text-sm font-medium text-gray-300">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="nov-descripcion"
              name="descripcion"
              rows={3}
              value={fields.descripcion}
              onChange={handleChange}
              required
              placeholder="Describe brevemente la novedad…"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm resize-none"
            />
          </div>

          {/* Vigencia + Estatus */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="nov-vigencia" className="block text-sm font-medium text-gray-300">
                Vigencia
                <span className="ml-1 text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                id="nov-vigencia"
                name="vigencia"
                type="text"
                value={fields.vigencia}
                onChange={handleChange}
                placeholder="Ej: Hasta el 30 de abril"
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nov-estatus" className="block text-sm font-medium text-gray-300">
                Estatus
              </label>
              <div className="relative">
                <select
                  id="nov-estatus"
                  name="estatus"
                  value={String(fields.estatus)}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-9 [color-scheme:dark] cursor-pointer"
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
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
                  Guardando…
                </>
              ) : 'Guardar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
