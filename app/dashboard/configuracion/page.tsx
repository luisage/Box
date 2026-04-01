'use client'

import { useState } from 'react'
import NovedadesConfig from './NovedadesConfig'
import ResenasConfig            from './ResenasConfig'
import CategoriasProductoConfig from './CategoriasProductoConfig'
import ProductosConfig          from './ProductosConfig'
import CarruselConfig           from './CarruselConfig'
import VideosConfig             from './VideosConfig'
import ContrasenaConfig         from './ContrasenaConfig'

type SeccionKey = '' | 'novedades' | 'resenas' | 'categorias' | 'productos' | 'carrusel' | 'videos' | 'contrasena'

const SECCIONES: { value: SeccionKey; label: string }[] = [
  { value: '',           label: 'Elige el tema a configurar' },
  { value: 'novedades',  label: 'Novedades' },
  { value: 'resenas',    label: 'Reseñas' },
  { value: 'categorias', label: 'Categorías de producto' },
  { value: 'productos',  label: 'Productos' },
  { value: 'carrusel',   label: 'Imágenes carrusel' },
  { value: 'videos',     label: 'Videos' },
  { value: 'contrasena', label: 'Modificar contraseña' },
]

export default function ConfiguracionPage() {
  const [seccion, setSeccion] = useState<SeccionKey>('')

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Administra el contenido del gimnasio</p>
      </div>

      {/* Selector */}
      <div className="mb-8 max-w-xs">
        <label htmlFor="select-seccion" className="block text-sm font-medium text-gray-400 mb-2">
          Tema
        </label>
        <div className="relative">
          <select
            id="select-seccion"
            value={seccion}
            onChange={(e) => setSeccion(e.target.value as SeccionKey)}
            className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-10 [color-scheme:dark] cursor-pointer"
          >
            {SECCIONES.map((s) => (
              <option key={s.value} value={s.value} disabled={s.value === ''}>
                {s.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Contenido */}
      {seccion === '' && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <svg className="w-14 h-14 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 text-sm">Selecciona un tema para comenzar a configurar</p>
        </div>
      )}

      {seccion === 'novedades' && <NovedadesConfig />}

      {seccion === 'resenas'    && <ResenasConfig />}
      {seccion === 'categorias' && <CategoriasProductoConfig />}

      {seccion === 'productos'  && <ProductosConfig />}
      {seccion === 'carrusel'   && <CarruselConfig />}
      {seccion === 'videos'     && <VideosConfig />}
      {seccion === 'contrasena' && <ContrasenaConfig />}
    </div>
  )
}
