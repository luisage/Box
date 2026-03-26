'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export type CarruselSlide = {
  id: number
  url: string
  nombre: string | null
}

const INTERVAL_MS  = 4000
const TRANSITION_MS = 1000

export default function Carousel({ slides }: { slides: CarruselSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused || slides.length <= 1) return

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, slides.length])

  if (slides.length === 0) return null

  return (
    <div
      className="relative h-72 md:h-[520px] overflow-hidden rounded-2xl cursor-pointer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
          className={`absolute inset-0 transition-opacity ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.url}
            alt={slide.nombre ?? `Slide ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 1280px"
          />
          {/* Overlay oscuro sutil */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Nombre de la imagen (si existe) */}
          {slide.nombre && (
            <div className="absolute bottom-14 left-0 right-0 flex justify-center">
              <span className="bg-black/50 text-white text-sm md:text-base font-semibold px-5 py-2 rounded-full backdrop-blur-sm select-none">
                {slide.nombre}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Indicador de pausa */}
      {paused && slides.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          ⏸ En pausa
        </div>
      )}

      {/* Dots de navegación */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-red-500 w-7' : 'bg-white/40 w-2 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
