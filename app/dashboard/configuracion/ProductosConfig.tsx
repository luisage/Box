'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { getProductos, getCategorias, crearProducto, actualizarProducto } from '@/app/actions'

type Producto = {
  id:          number
  nombre:      string
  descripcion: string
  imagen:      string | null
  costo:       number
  categoria:   string
  estatus:     boolean
}

type Categoria = { id: number; nombre: string; estatus: boolean }

// ── Dropzone de imagen ────────────────────────────────────────────────────────

interface DropzoneProps {
  preview:    string | null   // URL actual (existente o nueva)
  onChange:   (file: File) => void
}

function ImagenDropzone({ preview, onChange }: DropzoneProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function handleFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return
    onChange(file)
  }

  return (
    <div
      onDragOver={(e)  => { e.preventDefault(); setDrag(true)  }}
      onDragLeave={() =>  setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        handleFile(e.dataTransfer.files[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[120px] ${
        drag
          ? 'border-red-500 bg-red-950/20'
          : preview
            ? 'border-gray-700 bg-gray-900 hover:border-gray-600'
            : 'border-gray-700 bg-gray-900 hover:border-red-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={undefined}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <>
          <div className="relative w-full h-32 overflow-hidden rounded-xl">
            <Image src={preview} alt="Preview" fill className="object-contain p-2" unoptimized />
          </div>
          <p className="text-xs text-gray-500 pb-2">Haz clic o arrastra para cambiar la imagen</p>
        </>
      ) : (
        <>
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-gray-400 text-center px-4">
            Arrastra una imagen aquí o<br />
            <span className="text-red-400 font-medium">selecciona desde tu dispositivo</span>
          </p>
          <p className="text-xs text-gray-600 pb-2">JPG, PNG, WEBP</p>
        </>
      )}
    </div>
  )
}

// ── Modal crear / editar ──────────────────────────────────────────────────────

interface ModalProps {
  producto?:   Producto
  categorias:  Categoria[]
  onClose:     () => void
  onSuccess:   (msg: string) => void
}

function ProductoModal({ producto, categorias, onClose, onSuccess }: ModalProps) {
  const esEdicion = !!producto

  const [fields, setFields] = useState({
    nombre:      producto?.nombre      ?? '',
    descripcion: producto?.descripcion ?? '',
    costo:       producto ? String(producto.costo) : '',
    categoria:   producto?.categoria   ?? '',
    estatus:     producto?.estatus     ?? true,
  })
  const [imagenFile,    setImagenFile]    = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(producto?.imagen ?? null)
  const [pending,  setPending]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: name === 'estatus' ? value === 'true' : value }))
    if (error) setError('')
  }

  function handleImagenChange(file: File) {
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const fd = new FormData()
    if (esEdicion) {
      fd.set('id', String(producto!.id))
      fd.set('imagenActual', producto!.imagen ?? '')
    }
    fd.set('nombre',      fields.nombre)
    fd.set('descripcion', fields.descripcion)
    fd.set('costo',       fields.costo)
    fd.set('categoria',   fields.categoria)
    fd.set('estatus',     String(fields.estatus))
    if (imagenFile) fd.set('imagen', imagenFile)

    const result = esEdicion ? await actualizarProducto(fd) : await crearProducto(fd)

    if (result.success) {
      onSuccess(esEdicion ? 'Producto actualizado correctamente.' : 'Producto guardado correctamente.')
    } else {
      setError(result.error ?? 'Error desconocido.')
      setPending(false)
    }
  }

  const categoriasActivas = categorias.filter((c) => c.estatus)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Cabecera */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            {esEdicion && <p className="text-gray-400 text-sm mt-0.5">{producto!.nombre}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none mt-0.5" aria-label="Cerrar">✕</button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Nombre <span className="text-red-500">*</span></label>
            <input
              name="nombre" type="text" value={fields.nombre} onChange={handleChange}
              required autoFocus placeholder="Ej: Guantes de boxeo"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Descripción <span className="text-red-500">*</span></label>
            <textarea
              name="descripcion" rows={3} value={fields.descripcion} onChange={handleChange}
              required placeholder="Describe el producto…"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm resize-none"
            />
          </div>

          {/* Imagen */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Imagen <span className="text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <ImagenDropzone preview={imagenPreview} onChange={handleImagenChange} />
          </div>

          {/* Costo + Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Costo <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">$</span>
                <input
                  name="costo" type="number" min="1" value={fields.costo} onChange={handleChange}
                  required placeholder="0"
                  className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl pl-8 pr-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Categoría <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  name="categoria" value={fields.categoria} onChange={handleChange} required
                  className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-9 [color-scheme:dark] cursor-pointer"
                >
                  <option value="" disabled>Seleccionar…</option>
                  {categoriasActivas.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Estatus */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Estatus</label>
            <div className="relative max-w-xs">
              <select
                name="estatus" value={String(fields.estatus)} onChange={handleChange}
                className="w-full appearance-none bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm pr-9 [color-scheme:dark] cursor-pointer"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
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
              type="submit" disabled={pending}
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProductosConfig() {
  const [productos,  setProductos]  = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editando,   setEditando]   = useState<Producto | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [prods, cats] = await Promise.all([getProductos(), getCategorias()])
    setProductos(prods as Producto[])
    setCategorias(cats as Categoria[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function handleSuccess(msg: string) {
    setModalOpen(false)
    setEditando(null)
    setToast(msg)
    cargar()
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Productos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Administra el catálogo de productos del gimnasio</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-gray-500 text-sm">No hay productos registrados</p>
          <button onClick={() => setModalOpen(true)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
            Agregar el primer producto
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Imagen', 'Nombre', 'Descripción', 'Costo', 'Categoría', 'Estatus', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    {/* Imagen */}
                    <td className="px-4 py-3">
                      {p.imagen ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          <Image src={p.imagen} alt={p.nombre} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-100 font-medium whitespace-nowrap max-w-[140px]">
                      <span className="line-clamp-2">{p.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[220px]">
                      <span className="line-clamp-2">{p.descripcion}</span>
                    </td>
                    <td className="px-4 py-3 text-yellow-400 font-semibold whitespace-nowrap">
                      ${p.costo.toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{p.categoria}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        p.estatus
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.estatus ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {p.estatus ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditando(p)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductoModal categorias={categorias} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />
      )}
      {editando && (
        <ProductoModal producto={editando} categorias={categorias} onClose={() => setEditando(null)} onSuccess={handleSuccess} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl border bg-green-900 border-green-700 text-green-300 whitespace-nowrap">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  )
}
