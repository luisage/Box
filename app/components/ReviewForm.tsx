'use client'

import { useState } from 'react'
import { submitResena } from '@/app/actions'

export default function ReviewForm() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!rating) {
      setMessage({ text: 'Por favor selecciona una calificación.', ok: false })
      return
    }

    setPending(true)
    setMessage(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('calificacion', String(rating))
      await submitResena(formData)
      setMessage({ text: '¡Gracias por tu reseña! Será revisada y publicada pronto.', ok: true })
      setRating(0)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error al enviar. Intenta de nuevo.',
        ok: false,
      })
    } finally {
      setPending(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de estrellas */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={star <= displayRating ? 'text-yellow-400' : 'text-gray-700'}>
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
          </p>
        )}
      </div>

      {/* Comentario */}
      <div>
        <label htmlFor="comentario" className="block text-sm font-medium text-gray-300 mb-2">
          Comentario
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={4}
          required
          minLength={10}
          placeholder="Comparte tu experiencia en la academia..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none transition-colors"
        />
      </div>

      {message && (
        <p
          className={`text-sm rounded-xl px-4 py-3 ${
            message.ok
              ? 'bg-green-900/40 border border-green-800 text-green-400'
              : 'bg-red-900/40 border border-red-800 text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {pending ? 'Enviando...' : 'Enviar Reseña'}
      </button>
    </form>
  )
}
