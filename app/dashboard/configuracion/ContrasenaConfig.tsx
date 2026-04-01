'use client'

import { useState } from 'react'
import { cambiarContrasena } from '@/app/actions'

export default function ContrasenaConfig() {
  const [fields, setFields] = useState({ actual: '', nueva: '', confirma: '' })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)
  const [show, setShow] = useState({ actual: false, nueva: false, confirma: false })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error)   setError('')
    if (success) setSuccess('')
  }

  function handleCancel() {
    setFields({ actual: '', nueva: '', confirma: '' })
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    setSuccess('')

    const fd = new FormData()
    fd.set('actual',   fields.actual)
    fd.set('nueva',    fields.nueva)
    fd.set('confirma', fields.confirma)

    const result = await cambiarContrasena(fd)
    setPending(false)

    if (result.success) {
      setSuccess('Contraseña actualizada correctamente.')
      setFields({ actual: '', nueva: '', confirma: '' })
    } else {
      setError(result.error ?? 'Error desconocido.')
    }
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">

        {/* Contraseña actual */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="actual" className="text-sm font-medium text-gray-400">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              id="actual"
              name="actual"
              type={show.actual ? 'text' : 'password'}
              value={fields.actual}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, actual: !s.actual }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label={show.actual ? 'Ocultar' : 'Mostrar'}
            >
              {show.actual ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nueva" className="text-sm font-medium text-gray-400">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="nueva"
              name="nueva"
              type={show.nueva ? 'text' : 'password'}
              value={fields.nueva}
              onChange={handleChange}
              autoComplete="new-password"
              className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, nueva: !s.nueva }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label={show.nueva ? 'Ocultar' : 'Mostrar'}
            >
              {show.nueva ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirma" className="text-sm font-medium text-gray-400">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <input
              id="confirma"
              name="confirma"
              type={show.confirma ? 'text' : 'password'}
              value={fields.confirma}
              onChange={handleChange}
              autoComplete="new-password"
              className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, confirma: !s.confirma }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label={show.confirma ? 'Ocultar' : 'Mostrar'}
            >
              {show.confirma ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error   && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {pending ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>

      </form>
    </div>
  )
}
