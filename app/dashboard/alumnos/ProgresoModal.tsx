'use client'

import { useState, useEffect } from 'react'
import { registrarProgreso } from '@/app/actions'

interface Props {
  alumnoId: number
  alumnoNombre: string
  alumnoApellido: string
  onClose:   () => void
  onSuccess: () => void
}

export default function ProgresoModal({ alumnoId, alumnoNombre, alumnoApellido, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState({
    pesoKg:          '',
    tallaCm:         '',
    porcentajeGrasa: '',
    imc:             '',
    notas:           '',
  })
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Calcula IMC automáticamente cuando hay peso y talla
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFields((prev) => {
      const next = { ...prev, [name]: value }
      const peso  = parseFloat(name === 'pesoKg'  ? value : next.pesoKg)
      const talla = parseFloat(name === 'tallaCm' ? value : next.tallaCm)
      if (!isNaN(peso) && !isNaN(talla) && talla > 0) {
        const tallaM = talla / 100
        next.imc = (peso / (tallaM * tallaM)).toFixed(2)
      }
      return next
    })
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    fd.set('alumnoId',        String(alumnoId))
    fd.set('pesoKg',          fields.pesoKg)
    fd.set('tallaCm',         fields.tallaCm)
    fd.set('porcentajeGrasa', fields.porcentajeGrasa)
    fd.set('imc',             fields.imc)
    fd.set('notas',           fields.notas)

    const result = await registrarProgreso(fd)

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
            <h2 className="text-white font-bold text-base">Registrar progreso</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {alumnoNombre} {alumnoApellido}
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

          {/* Peso + Talla */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prog-peso" className="block text-sm font-medium text-gray-300">
                Peso <span className="text-xs text-gray-500 font-normal">(kg)</span>
              </label>
              <input
                id="prog-peso"
                name="pesoKg"
                type="number"
                min="1"
                max="300"
                step="0.1"
                value={fields.pesoKg}
                onChange={handleChange}
                placeholder="—"
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prog-talla" className="block text-sm font-medium text-gray-300">
                Talla <span className="text-xs text-gray-500 font-normal">(cm, ej: 170)</span>
              </label>
              <input
                id="prog-talla"
                name="tallaCm"
                type="number"
                min="50"
                max="250"
                step="0.1"
                value={fields.tallaCm}
                onChange={handleChange}
                placeholder="170"
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* % Grasa + IMC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prog-grasa" className="block text-sm font-medium text-gray-300">
                % Grasa
              </label>
              <div className="relative">
                <input
                  id="prog-grasa"
                  name="porcentajeGrasa"
                  type="number"
                  min="0"
                  max="99"
                  step="0.1"
                  value={fields.porcentajeGrasa}
                  onChange={handleChange}
                  placeholder="—"
                  className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 pr-8 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs select-none">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prog-imc" className="block text-sm font-medium text-gray-300">
                IMC
                <span className="ml-1 text-xs text-gray-500 font-normal">(auto)</span>
              </label>
              <input
                id="prog-imc"
                name="imc"
                type="number"
                min="0"
                max="99"
                step="0.01"
                value={fields.imc}
                onChange={handleChange}
                placeholder="—"
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label htmlFor="prog-notas" className="block text-sm font-medium text-gray-300">
              Notas
              <span className="ml-1 text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <textarea
              id="prog-notas"
              name="notas"
              rows={3}
              value={fields.notas}
              onChange={handleChange}
              placeholder="Observaciones, metas, comentarios…"
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
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
