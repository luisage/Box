'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVideos, subirVideo, actualizarVideo, eliminarVideo } from '@/app/actions'

type VideoRow = {
  id:          number
  nombre:      string | null
  descripcion: string | null
  url:         string
  publicId:    string
  estatus:     boolean
  orden:       number
  creadoEn:    Date
}

// ── Dropzone de video ─────────────────────────────────────────────────────────

function VideoDropzone({
  file,
  urlActual,
  onChange,
}: {
  file:      File | null
  urlActual: string | null
  onChange:  (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function handleFile(f: File | undefined | null) {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v']
    const esVideo = f.type.startsWith('video/') || videoExts.includes(ext)
    if (!esVideo) return
    onChange(f)
  }

  const label = file
    ? file.name
    : urlActual
      ? 'Video actual (haz clic para reemplazar)'
      : null

  return (
    <div
      onDragOver={(e)  => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[110px] ${
        drag
          ? 'border-red-500 bg-red-950/20'
          : label
            ? 'border-gray-600 bg-gray-900 hover:border-gray-500'
            : 'border-gray-700 bg-gray-900 hover:border-red-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {label ? (
        <>
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75v7.5M15.75 12H8.25" />
          </svg>
          <p className="text-sm text-gray-300 text-center px-4 break-all">{label}</p>
          {file && (
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          )}
          <p className="text-xs text-gray-600 pb-2">Haz clic o arrastra para cambiar</p>
        </>
      ) : (
        <>
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-sm text-gray-400 text-center px-4">
            Arrastra el video aquí o<br />
            <span className="text-red-400 font-medium">selecciona desde tu dispositivo</span>
          </p>
          <p className="text-xs text-gray-600 pb-2">MP4, MOV, WEBM · máx. 100 MB</p>
        </>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  video?:    VideoRow
  onClose:   () => void
  onSuccess: (msg: string) => void
}

function VideoModal({ video, onClose, onSuccess }: ModalProps) {
  const esEdicion = !!video
  const [fields, setFields] = useState({
    nombre:      video?.nombre      ?? '',
    descripcion: video?.descripcion ?? '',
    estatus:     video?.estatus     ?? true,
    orden:       video ? String(video.orden) : '0',
  })
  const [videoFile,  setVideoFile]  = useState<File | null>(null)
  const [pending,    setPending]    = useState(false)
  const [error,      setError]      = useState('')
  const [progreso,   setProgreso]   = useState(false)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!esEdicion && !videoFile) { setError('Selecciona un video.'); return }
    setPending(true)
    setProgreso(true)
    setError('')

    const fd = new FormData()
    if (esEdicion) {
      fd.set('id',             String(video!.id))
      fd.set('urlActual',      video!.url)
      fd.set('publicIdActual', video!.publicId)
    }
    fd.set('nombre',      fields.nombre)
    fd.set('descripcion', fields.descripcion)
    fd.set('estatus',     String(fields.estatus))
    fd.set('orden',       fields.orden)
    if (videoFile) fd.set('video', videoFile)

    const result = esEdicion ? await actualizarVideo(fd) : await subirVideo(fd)

    setProgreso(false)
    if (result.success) {
      onSuccess(esEdicion ? 'Video actualizado correctamente.' : 'Video subido correctamente.')
    } else {
      setError(result.error ?? 'Error desconocido.')
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose() }}
    >
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">
              {esEdicion ? 'Editar video' : 'Subir video'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {esEdicion ? (video!.nombre ?? video!.url) : 'El video se subirá a Cloudinary'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={pending}
            className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none mt-0.5 disabled:opacity-30"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Video */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Video {!esEdicion && <span className="text-red-500">*</span>}
            </label>
            <VideoDropzone
              file={videoFile}
              urlActual={esEdicion ? video!.url : null}
              onChange={setVideoFile}
            />
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Nombre <span className="text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              name="nombre" type="text" value={fields.nombre} onChange={handleChange}
              placeholder="Ej: Clase de sombra"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Descripción <span className="text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <textarea
              name="descripcion" rows={2} value={fields.descripcion} onChange={handleChange}
              placeholder="Breve descripción del video…"
              className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 outline-none transition-colors text-sm resize-none"
            />
          </div>

          {/* Orden + Estatus */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Orden</label>
              <input
                name="orden" type="number" min="0" value={fields.orden} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-gray-100 outline-none transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Estatus</label>
              <div className="relative">
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
          </div>

          {/* Progreso de subida */}
          {progreso && (
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <svg className="animate-spin w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-300">Subiendo a Cloudinary… esto puede tardar unos segundos</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={pending} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30">
              Cancelar
            </button>
            <button
              type="submit" disabled={pending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {pending ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Subiendo…</>
              ) : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function VideosConfig() {
  const [videos,    setVideos]    = useState<VideoRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando,  setEditando]  = useState<VideoRow | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const data = await getVideos()
    setVideos(data as VideoRow[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function handleSuccess(msg: string) {
    setModalOpen(false)
    setEditando(null)
    setToast({ msg, ok: true })
    cargar()
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este video? Se borrará también de Cloudinary.')) return
    setDeletingId(id)
    const result = await eliminarVideo(id)
    setDeletingId(null)
    if (result.success) {
      setToast({ msg: 'Video eliminado.', ok: true })
      cargar()
    } else {
      setToast({ msg: result.error ?? 'Error al eliminar.', ok: false })
    }
  }

  const formatSize = (v: VideoRow) => v.url ? '—' : ''

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg">Videos</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Videos almacenados en Cloudinary · {!loading && `${videos.length} registrado${videos.length !== 1 ? 's' : ''}`}
          </p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-gray-500 text-sm">No hay videos registrados</p>
          <button onClick={() => setModalOpen(true)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
            Subir el primer video
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['#', 'Nombre', 'Descripción', 'Estatus', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs w-10">{v.orden}</td>
                    <td className="px-5 py-3.5 text-gray-100 font-medium max-w-[180px]">
                      {v.nombre
                        ? <span className="line-clamp-1">{v.nombre}</span>
                        : <span className="text-gray-600 italic text-xs">Sin nombre</span>}
                      <p className="text-xs text-gray-600 font-normal mt-0.5 font-mono line-clamp-1">{v.url.split('/').pop()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 max-w-[220px]">
                      {v.descripcion
                        ? <span className="line-clamp-2">{v.descripcion}</span>
                        : <span className="text-gray-600 italic text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        v.estatus
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${v.estatus ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {v.estatus ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditando(v)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEliminar(v.id)}
                          disabled={deletingId === v.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30"
                          title="Eliminar"
                        >
                          {deletingId === v.id
                            ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <VideoModal onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />}
      {editando  && <VideoModal video={editando} onClose={() => setEditando(null)} onSuccess={handleSuccess} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl border whitespace-nowrap ${
          toast.ok ? 'bg-green-900 border-green-700 text-green-300' : 'bg-red-900 border-red-700 text-red-300'
        }`}>
          {toast.ok
            ? <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            : <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
