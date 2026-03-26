'use client'

import { useState, useEffect } from 'react'
import { actualizarDatosExtras } from '@/app/actions'

// ── Opciones de selects ───────────────────────────────────────────────────────

const NIVELES = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
  { value: 'COMPETIDOR',   label: 'Competidor'   },
]

const TURNOS = [
  { value: 'MANANA', label: 'Mañana' },
  { value: 'TARDE',  label: 'Tarde'  },
  { value: 'NOCHE',  label: 'Noche'  },
]

const ESTADOS = [
  { value: 'ACTIVO',   label: 'Activo'   },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'BAJA',     label: 'Baja'     },
]

const CATEGORIAS_PESO = [
  { value: '',             label: '— Sin categoría —'         },
  { value: 'MINIMOSMO',    label: 'Mínimo mosca  (≤ 47.6 kg)' },
  { value: 'MOSCA',        label: 'Mosca         (≤ 50.8 kg)' },
  { value: 'SUPERMOSCA',   label: 'Súper mosca   (≤ 52.2 kg)' },
  { value: 'GALLO',        label: 'Gallo         (≤ 53.5 kg)' },
  { value: 'SUPERGALLO',   label: 'Súper gallo   (≤ 55.3 kg)' },
  { value: 'PLUMA',        label: 'Pluma         (≤ 57.2 kg)' },
  { value: 'SUPERPLUMA',   label: 'Súper pluma   (≤ 59 kg)'   },
  { value: 'LIGERO',       label: 'Ligero        (≤ 61.2 kg)' },
  { value: 'SUPERLIGERO',  label: 'Súper ligero  (≤ 63.5 kg)' },
  { value: 'WELTER',       label: 'Wélter        (≤ 66.7 kg)' },
  { value: 'SUPERWELTER',  label: 'Súper wélter  (≤ 69.9 kg)' },
  { value: 'MEDIANO',      label: 'Mediano       (≤ 72.6 kg)' },
  { value: 'SUPERMEDIANO', label: 'Súper mediano (≤ 76.2 kg)' },
  { value: 'SEMIPESADO',   label: 'Semipesado    (≤ 79.4 kg)' },
  { value: 'CRUCERO',      label: 'Crucero       (≤ 90.7 kg)' },
  { value: 'PESADO',       label: 'Pesado        (> 90.7 kg)' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DatosExtrasAlumno {
  id:            number
  nombre:        string
  apellido:      string
  nivel:         string
  pesoKg:        number | null
  categoriaPeso: string | null
  turno:         string
  estado:        string
}

interface Props {
  alumno:    DatosExtrasAlumno
  onClose:   () => void
  onSuccess: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DatosExtrasModal({ alumno, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState({
    nivel:         alumno.nivel         ?? 'PRINCIPIANTE',
    pesoKg:        alumno.pesoKg        != null ? String(alumno.pesoKg) : '',
    categoriaPeso: alumno.categoriaPeso ?? '',
    turno:         alumno.turno         ?? 'TARDE',
    estado:        alumno.estado        ?? 'ACTIVO',
  })
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    fd.set('alumnoId',      String(alumno.id))
    fd.set('nivel',         fields.nivel)
    fd.set('pesoKg',        fields.pesoKg)
    fd.set('categoriaPeso', fields.categoriaPeso)
    fd.set('turno',         fields.turno)
    fd.set('estado',        fields.estado)

    const result = await actualizarDatosExtras(fd)

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
            <h2 className="text-white font-bold text-base">Datos Extras</h2>
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

          {/* Fila: Nivel + Turno */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label htmlFor="nivel" className="block text-sm font-medium text-gray-300">
                Nivel
              </label>
              <select
                id="nivel"
                name="nivel"
                value={fields.nivel}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
              >
                {NIVELES.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="turno" className="block text-sm font-medium text-gray-300">
                Turno
              </label>
              <select
                id="turno"
                name="turno"
                value={fields.turno}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
              >
                {TURNOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Fila: Peso + Estado */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label htmlFor="pesoKg" className="block text-sm font-medium text-gray-300">
                Peso
                <span className="ml-1.5 text-xs text-gray-500 font-normal">(kg, opcional)</span>
              </label>
              <div className="relative">
                <input
                  id="pesoKg"
                  name="pesoKg"
                  type="number"
                  min="1"
                  max="300"
                  step="1"
                  value={fields.pesoKg}
                  onChange={handleChange}
                  placeholder="—"
                  className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="estado" className="block text-sm font-medium text-gray-300">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={fields.estado}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Categoría de peso */}
          <div className="space-y-1.5">
            <label htmlFor="categoriaPeso" className="block text-sm font-medium text-gray-300">
              Categoría de peso
              <span className="ml-1.5 text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <select
              id="categoriaPeso"
              name="categoriaPeso"
              value={fields.categoriaPeso}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
            >
              {CATEGORIAS_PESO.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
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
