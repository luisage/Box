import { Suspense } from 'react'
import { prisma } from '@/app/lib/prisma'
import Image from 'next/image'
import Carousel from '@/app/components/Carousel'
import ReviewForm from '@/app/components/ReviewForm'
import Header from '@/app/components/Header'
import { getVideosActivos, getImagenesCarruselActivas, getNovedades, getProductosActivos } from '@/app/actions'

// ── Productos estáticos (reemplaza con tu catálogo real) ─────────────────────
const productos = [
  {
    id: 1,
    nombre: 'Guantes de Entrenamiento',
    descripcion: 'Guantes profesionales con relleno de espuma de alta densidad, ideales para saco y sparring.',
    precio: 850,
    emoji: '🥊',
  },
  {
    id: 2,
    nombre: 'Vendas para Manos',
    descripcion: 'Vendas de algodón elástico de 3.5 m para máxima protección de muñecas y nudillos.',
    precio: 150,
    emoji: '🩹',
  },
  {
    id: 3,
    nombre: 'Casco de Entrenamiento',
    descripcion: 'Casco con protección completa de cuero sintético y espuma de amortiguación multicapa.',
    precio: 1200,
    emoji: '⛑️',
  },
  {
    id: 4,
    nombre: 'Cuerda para Saltar',
    descripcion: 'Cuerda de velocidad con mangos ergonómicos y rodamientos de precisión para cardio intenso.',
    precio: 280,
    emoji: '🌀',
  },
  {
    id: 5,
    nombre: 'Protector Bucal',
    descripcion: 'Protector termoplástico moldeable para máxima comodidad y protección dental.',
    precio: 120,
    emoji: '🦷',
  },
  {
    id: 6,
    nombre: 'Saco de Boxeo',
    descripcion: 'Saco relleno de 40 kg con cadena reforzada, ideal para entrenamiento en casa o gimnasio.',
    precio: 2500,
    emoji: '🏋️',
  },
]

// ── Horarios ─────────────────────────────────────────────────────────────────
const horarios = [
  { dia: 'Lunes – Viernes', horario: '7:00 – 10:00 · 16:00 – 20:00' },
  { dia: 'Sábado', horario: '8:00 – 12:00' },
  { dia: 'Domingo', horario: 'Cerrado' },
]

// ── Reseñas visibles (Server Component) ──────────────────────────────────────
async function ResenasRecientes() {
  const resenas = await prisma.resena.findMany({
    where: { estado: 'VISIBLE' },
    orderBy: { creadoEn: 'desc' },
    take: 6,
  })

  if (resenas.length === 0) {
    return (
      <p className="text-gray-500 text-center py-10">
        Aún no hay reseñas publicadas. ¡Sé el primero!
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resenas.map((resena) => (
        <div
          key={resena.id}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:border-gray-700 transition-colors"
        >
          <div className="flex gap-0.5 text-xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < resena.calificacion ? 'text-yellow-400' : 'text-gray-700'}>
                ★
              </span>
            ))}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">"{resena.comentario}"</p>
          <p className="text-gray-600 text-xs">
            {new Date(resena.creadoEn).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Videos (Server Component) ────────────────────────────────────────────────
async function VideosSection() {
  const videos = await getVideosActivos()

  if (videos.length === 0) return null

  return (
    <section id="videos" className="scroll-mt-20">
      <h2 className="text-3xl font-black text-white text-center mb-10">
        Videos
        <span className="block w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full" />
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
          >
            <video
              src={video.url}
              controls
              preload="metadata"
              className="w-full h-auto block"
            />
            <div className="p-5">
              <h3 className="text-white font-bold text-base mb-1 line-clamp-1">{video.nombre}</h3>
              {video.descripcion && (
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{video.descripcion}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function VideosSkeleton() {
  return (
    <section className="scroll-mt-20">
      <div className="h-9 bg-gray-800 rounded w-32 mx-auto mb-10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="w-full aspect-video bg-gray-800" />
            <div className="p-5 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResenasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-40 animate-pulse" />
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default async function Home() {
  const [slidesCarrusel, novedades, productos] = await Promise.all([
    getImagenesCarruselActivas(),
    getNovedades(true),
    getProductosActivos(),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 py-10">

        {/* ── CARRUSEL HERO ─────────────────────────────────────────────────── */}
        {slidesCarrusel.length > 0 && (
          <section>
            <Carousel slides={slidesCarrusel} />
          </section>
        )}

        {/* ── INFO: horarios, dirección, contacto ──────────────────────────── */}
        <section id="info" className="scroll-mt-20">
          <h2 className="text-3xl font-black text-white text-center mb-10">
            Encuéntranos
            <span className="block w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Horarios */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-red-600/20 rounded-xl flex items-center justify-center text-xl">🕐</div>
                <h3 className="text-lg font-bold text-white">Horarios</h3>
              </div>
              <ul className="space-y-4 text-sm">
                {horarios.map((h) => (
                  <li key={h.dia} className="flex flex-col gap-0.5">
                    <span className="text-gray-400 font-semibold">{h.dia}</span>
                    <span className="text-gray-200">{h.horario}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dirección */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-red-600/20 rounded-xl flex items-center justify-center text-xl">📍</div>
                <h3 className="text-lg font-bold text-white">Dirección</h3>
              </div>
              {/* TODO: reemplaza con la dirección real */}
              <p className="text-gray-300 text-sm leading-7">
                Calle Principal #123<br />
                Col. Centro<br />
                Ciudad, Estado CP 00000<br />
                México
              </p>
              <a
                href="#"
                className="inline-block mt-5 text-red-500 hover:text-red-400 text-sm font-semibold transition-colors"
              >
                Ver en mapa →
              </a>
            </div>

            {/* Contacto */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-red-600/20 rounded-xl flex items-center justify-center text-xl">📞</div>
                <h3 className="text-lg font-bold text-white">Contacto</h3>
              </div>
              {/* TODO: reemplaza con los datos reales */}
              <ul className="space-y-4 text-sm">
                <li>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Teléfono</p>
                  <a href="tel:+521234567890" className="text-gray-200 hover:text-white transition-colors">
                    +52 (123) 456-7890
                  </a>
                </li>
                <li>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">WhatsApp</p>
                  <a href="https://wa.me/521234567890" className="text-gray-200 hover:text-white transition-colors">
                    +52 (123) 456-7890
                  </a>
                </li>
                <li>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Email</p>
                  <a href="mailto:info@academiaelite.mx" className="text-gray-200 hover:text-white transition-colors">
                    info@academiaelite.mx
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* ── NOVEDADES ─────────────────────────────────────────────────────── */}
        {novedades.length > 0 && (
          <section id="novedades" className="scroll-mt-20">
            <h2 className="text-3xl font-black text-white text-center mb-10">
              Novedades
              <span className="block w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {novedades.map((novedad, i) => {
                const esImpar = i % 2 === 0
                return (
                  <div
                    key={novedad.id}
                    className={`relative overflow-hidden rounded-2xl p-8 border ${
                      esImpar
                        ? 'bg-gradient-to-br from-red-900 to-red-950 border-red-800'
                        : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                    <h3 className="text-2xl font-black text-white mb-3">{novedad.titulo}</h3>
                    <p className={`text-sm leading-relaxed ${esImpar ? 'text-red-200' : 'text-gray-300'}`}>
                      {novedad.descripcion}
                    </p>
                    {novedad.vigencia && (
                      <p className={`text-xs font-bold mt-5 ${esImpar ? 'text-yellow-400' : 'text-gray-500'}`}>
                        📅 {novedad.vigencia}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── VIDEOS ────────────────────────────────────────────────────────── */}
        <Suspense fallback={<VideosSkeleton />}>
          <VideosSection />
        </Suspense>

        {/* ── PRODUCTOS ─────────────────────────────────────────────────────── */}
        {productos.length > 0 && (
          <section id="productos" className="scroll-mt-20">
            <h2 className="text-3xl font-black text-white text-center mb-10">
              Equipamiento
              <span className="block w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="group bg-gray-900 border border-gray-800 hover:border-red-800 rounded-2xl p-6 flex flex-col transition-colors"
                >
                  {/* Imagen o ícono de respaldo */}
                  {producto.imagen ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-5 bg-gray-800">
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 group-hover:bg-red-900/30 rounded-2xl flex items-center justify-center mb-5 transition-colors">
                      <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                  )}

                  {/* Categoría */}
                  {producto.categoria && (
                    <span className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">
                      {producto.categoria}
                    </span>
                  )}

                  <h3 className="text-white font-bold text-lg mb-2">{producto.nombre}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1">{producto.descripcion}</p>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-800">
                    <span className="text-yellow-400 font-black text-xl">
                      ${producto.costo.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── RESEÑAS RECIENTES ─────────────────────────────────────────────── */}
        <section id="resenas" className="scroll-mt-20">
          <h2 className="text-3xl font-black text-white text-center mb-10">
            Lo que dicen nuestros alumnos
            <span className="block w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full" />
          </h2>
          <Suspense fallback={<ResenasSkeleton />}>
            <ResenasRecientes />
          </Suspense>
        </section>

        {/* ── FORMULARIO DE RESEÑA ──────────────────────────────────────────── */}
        <section id="escribe-resena" className="scroll-mt-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-black text-white mb-1">Comparte tu experiencia</h2>
              <p className="text-gray-400 text-sm mb-8">
                Tu opinión nos ayuda a mejorar. Escribe tu reseña y la publicaremos pronto.
              </p>
              <ReviewForm />
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <span>🥊</span>
            <span className="font-bold text-gray-500">Academia Élite de Box</span>
          </div>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
