'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { ahoraEnCDMX } from '@/app/lib/timezone'
import { cloudinary } from '@/app/lib/cloudinary'

// ── Videos ────────────────────────────────────────────────────────────────────

export async function getVideos() {
  return prisma.videos.findMany({ orderBy: [{ orden: 'asc' }, { creadoEn: 'desc' }] })
}

export async function getVideosActivos() {
  return prisma.videos.findMany({
    where:   { estatus: true },
    orderBy: [{ orden: 'asc' }, { creadoEn: 'desc' }],
  })
}

export async function subirVideo(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const nombre      = (formData.get('nombre')      as string)?.trim() || null
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  const estatus     = formData.get('estatus') === 'true'
  const orden       = parseInt((formData.get('orden') as string) || '0') || 0
  const videoFile   = formData.get('video') as File | null

  if (!videoFile || videoFile.size === 0) return { error: 'Selecciona un video.' }

  const maxBytes = 100 * 1024 * 1024 // 100 MB límite
  if (videoFile.size > maxBytes) return { error: 'El video no debe superar 100 MB.' }

  try {
    const buffer   = Buffer.from(await videoFile.arrayBuffer())
    const b64      = buffer.toString('base64')
    const mime     = videoFile.type || 'video/mp4'
    const dataUri  = `data:${mime};base64,${b64}`

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'video',
      folder:        'box_gym/videos',
      chunk_size:    6_000_000,
    })

    await prisma.videos.create({
      data: {
        nombre,
        descripcion,
        url:      result.secure_url,
        publicId: result.public_id,
        estatus,
        orden,
      },
    })
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    console.error('[subirVideo]', e)
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `Error: ${msg}` }
  }
}

export async function actualizarVideo(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id          = parseInt(formData.get('id') as string)
  const nombre      = (formData.get('nombre')      as string)?.trim() || null
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  const estatus     = formData.get('estatus') === 'true'
  const orden       = parseInt((formData.get('orden') as string) || '0') || 0
  const videoFile   = formData.get('video') as File | null
  const urlActual   = (formData.get('urlActual')   as string)?.trim()
  const publicIdActual = (formData.get('publicIdActual') as string)?.trim()

  if (isNaN(id)) return { error: 'Video inválido.' }

  let url      = urlActual
  let publicId = publicIdActual

  if (videoFile && videoFile.size > 0) {
    if (videoFile.size > 100 * 1024 * 1024) return { error: 'El video no debe superar 100 MB.' }
    try {
      const buffer  = Buffer.from(await videoFile.arrayBuffer())
      const b64     = buffer.toString('base64')
      const mime    = videoFile.type || 'video/mp4'
      const dataUri = `data:${mime};base64,${b64}`
      const result  = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'video',
        folder:        'box_gym/videos',
        chunk_size:    6_000_000,
      })
      url      = result.secure_url
      publicId = result.public_id
      // Eliminar video anterior de Cloudinary
      if (publicIdActual) {
        await cloudinary.uploader.destroy(publicIdActual, { resource_type: 'video' }).catch(() => {})
      }
    } catch (e) {
      console.error('[actualizarVideo upload]', e)
      return { error: 'Error al subir el video.' }
    }
  }

  try {
    await prisma.videos.update({
      where: { id },
      data:  { nombre, descripcion, url, publicId, estatus, orden },
    })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al actualizar el video.' }
  }
}

export async function eliminarVideo(
  id: number
): Promise<{ error?: string; success?: boolean }> {
  try {
    const video = await prisma.videos.findUnique({ where: { id } })
    if (!video) return { error: 'Video no encontrado.' }
    await prisma.videos.delete({ where: { id } })
    if (video.publicId) {
      await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' }).catch(() => {})
    }
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al eliminar el video.' }
  }
}

// ── Productos ─────────────────────────────────────────────────────────────────

export async function getProductos() {
  return prisma.productos.findMany({ orderBy: { id: 'desc' } })
}

export async function getProductosActivos() {
  return prisma.productos.findMany({
    where:   { estatus: true },
    orderBy: { id: 'asc' },
  })
}

export async function crearProducto(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const nombre      = (formData.get('nombre')      as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim()
  const costoRaw    = (formData.get('costo')        as string)?.trim()
  const categoria   = (formData.get('categoria')   as string)?.trim()
  const estatus     = formData.get('estatus') === 'true'
  const imagenFile  = formData.get('imagen') as File | null

  if (!nombre      || nombre.length < 2)      return { error: 'El nombre debe tener al menos 2 caracteres.' }
  if (!descripcion || descripcion.length < 5) return { error: 'La descripción debe tener al menos 5 caracteres.' }
  if (!categoria)                             return { error: 'Selecciona una categoría.' }

  const costo = parseInt(costoRaw)
  if (isNaN(costo) || costo <= 0) return { error: 'El costo debe ser un número mayor a 0.' }

  let imagen:   string | null = null
  let publicId: string | null = null
  if (imagenFile && imagenFile.size > 0) {
    try {
      const buffer  = Buffer.from(await imagenFile.arrayBuffer())
      const dataUri = `data:${imagenFile.type};base64,${buffer.toString('base64')}`
      const result  = await cloudinary.uploader.upload(dataUri, { folder: 'box_gym/productos' })
      imagen   = result.secure_url
      publicId = result.public_id
    } catch {
      return { error: 'Error al subir la imagen.' }
    }
  }

  try {
    await prisma.productos.create({ data: { nombre, descripcion, imagen, publicId, costo, categoria, estatus } })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al guardar el producto. Intenta de nuevo.' }
  }
}

export async function actualizarProducto(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id              = parseInt(formData.get('id')              as string)
  const nombre          = (formData.get('nombre')                  as string)?.trim()
  const descripcion     = (formData.get('descripcion')             as string)?.trim()
  const costoRaw        = (formData.get('costo')                   as string)?.trim()
  const categoria       = (formData.get('categoria')               as string)?.trim()
  const estatus         = formData.get('estatus') === 'true'
  const imagenFile      = formData.get('imagen')       as File | null
  const imagenActual    = (formData.get('imagenActual')            as string)?.trim() || null
  const publicIdActual  = (formData.get('publicIdActual')          as string)?.trim() || null

  if (isNaN(id))                              return { error: 'Producto inválido.' }
  if (!nombre      || nombre.length < 2)      return { error: 'El nombre debe tener al menos 2 caracteres.' }
  if (!descripcion || descripcion.length < 5) return { error: 'La descripción debe tener al menos 5 caracteres.' }
  if (!categoria)                             return { error: 'Selecciona una categoría.' }

  const costo = parseInt(costoRaw)
  if (isNaN(costo) || costo <= 0) return { error: 'El costo debe ser un número mayor a 0.' }

  let imagen   = imagenActual
  let publicId = publicIdActual
  if (imagenFile && imagenFile.size > 0) {
    try {
      const buffer  = Buffer.from(await imagenFile.arrayBuffer())
      const dataUri = `data:${imagenFile.type};base64,${buffer.toString('base64')}`
      const result  = await cloudinary.uploader.upload(dataUri, { folder: 'box_gym/productos' })
      imagen   = result.secure_url
      publicId = result.public_id
      if (publicIdActual) {
        await cloudinary.uploader.destroy(publicIdActual).catch(() => {})
      }
    } catch {
      return { error: 'Error al subir la imagen.' }
    }
  }

  try {
    await prisma.productos.update({ where: { id }, data: { nombre, descripcion, imagen, publicId, costo, categoria, estatus } })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al actualizar el producto. Intenta de nuevo.' }
  }
}

// ── Imágenes carrusel ─────────────────────────────────────────────────────────

export async function getImagenesCarrusel() {
  return prisma.imagenCarrusel.findMany({ orderBy: { id: 'desc' } })
}

export async function getImagenesCarruselActivas() {
  return prisma.imagenCarrusel.findMany({
    where: { estatus: true },
    orderBy: { id: 'asc' },
  })
}

export async function crearImagenCarrusel(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const nombre     = (formData.get('nombre') as string)?.trim() || null
  const estatus    = formData.get('estatus') === 'true'
  const imagenFile = formData.get('imagen') as File | null

  if (!imagenFile || imagenFile.size === 0)
    return { error: 'Selecciona una imagen.' }

  try {
    const buffer  = Buffer.from(await imagenFile.arrayBuffer())
    const dataUri = `data:${imagenFile.type};base64,${buffer.toString('base64')}`
    const result  = await cloudinary.uploader.upload(dataUri, { folder: 'box_gym/carrusel' })
    await prisma.imagenCarrusel.create({ data: { nombre, url: result.secure_url, publicId: result.public_id, estatus } })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al guardar la imagen. Intenta de nuevo.' }
  }
}

export async function actualizarImagenCarrusel(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id             = parseInt(formData.get('id') as string)
  const nombre         = (formData.get('nombre') as string)?.trim() || null
  const estatus        = formData.get('estatus') === 'true'
  const imagenFile     = formData.get('imagen') as File | null
  const urlActual      = (formData.get('urlActual')     as string)?.trim() || null
  const publicIdActual = (formData.get('publicIdActual') as string)?.trim() || null

  if (isNaN(id)) return { error: 'Imagen inválida.' }

  let url      = urlActual
  let publicId = publicIdActual
  if (imagenFile && imagenFile.size > 0) {
    try {
      const buffer  = Buffer.from(await imagenFile.arrayBuffer())
      const dataUri = `data:${imagenFile.type};base64,${buffer.toString('base64')}`
      const result  = await cloudinary.uploader.upload(dataUri, { folder: 'box_gym/carrusel' })
      url      = result.secure_url
      publicId = result.public_id
      if (publicIdActual) {
        await cloudinary.uploader.destroy(publicIdActual).catch(() => {})
      }
    } catch {
      return { error: 'Error al guardar la imagen.' }
    }
  }

  if (!url) return { error: 'La imagen es requerida.' }

  try {
    await prisma.imagenCarrusel.update({ where: { id }, data: { nombre, url, publicId, estatus } })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Error al actualizar. Intenta de nuevo.' }
  }
}

// ── Categorías de producto ────────────────────────────────────────────────────

export async function getCategorias() {
  return prisma.categoriaProducto.findMany({ orderBy: { id: 'desc' } })
}

export async function crearCategoria(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const nombre  = (formData.get('nombre') as string)?.trim()
  const estatus = formData.get('estatus') === 'true'

  if (!nombre || nombre.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' }

  try {
    await prisma.categoriaProducto.create({ data: { nombre, estatus } })
    return { success: true }
  } catch {
    return { error: 'Error al guardar la categoría. Intenta de nuevo.' }
  }
}

export async function actualizarCategoria(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id      = parseInt(formData.get('id') as string)
  const nombre  = (formData.get('nombre') as string)?.trim()
  const estatus = formData.get('estatus') === 'true'

  if (isNaN(id))                    return { error: 'Categoría inválida.' }
  if (!nombre || nombre.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' }

  try {
    await prisma.categoriaProducto.update({ where: { id }, data: { nombre, estatus } })
    return { success: true }
  } catch {
    return { error: 'Error al actualizar la categoría. Intenta de nuevo.' }
  }
}

// ── Novedades ─────────────────────────────────────────────────────────────────

export async function getNovedades(estatus: boolean) {
  return prisma.novedades.findMany({
    where:   { estatus },
    orderBy: { id: 'desc' },
  })
}

export async function crearNovedad(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const titulo      = (formData.get('titulo')      as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim()
  const vigencia    = (formData.get('vigencia')    as string)?.trim() || null
  const estatus     = formData.get('estatus') === 'true'

  if (!titulo      || titulo.length < 2)      return { error: 'El título debe tener al menos 2 caracteres.' }
  if (!descripcion || descripcion.length < 5) return { error: 'La descripción debe tener al menos 5 caracteres.' }

  try {
    await prisma.novedades.create({ data: { titulo, descripcion, vigencia, estatus } })
    return { success: true }
  } catch {
    return { error: 'Error al guardar la novedad. Intenta de nuevo.' }
  }
}

export async function actualizarNovedad(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id          = parseInt(formData.get('id') as string)
  const titulo      = (formData.get('titulo')      as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim()
  const vigencia    = (formData.get('vigencia')    as string)?.trim() || null
  const estatus     = formData.get('estatus') === 'true'

  if (isNaN(id))                              return { error: 'Novedad inválida.' }
  if (!titulo      || titulo.length < 2)      return { error: 'El título debe tener al menos 2 caracteres.' }
  if (!descripcion || descripcion.length < 5) return { error: 'La descripción debe tener al menos 5 caracteres.' }

  try {
    await prisma.novedades.update({ where: { id }, data: { titulo, descripcion, vigencia, estatus } })
    return { success: true }
  } catch {
    return { error: 'Error al actualizar la novedad. Intenta de nuevo.' }
  }
}

// ── Reseñas (admin) ───────────────────────────────────────────────────────────

export type EstadoResenaFiltro = 'TODOS' | 'PENDIENTE' | 'VISIBLE' | 'OCULTA'

export async function getResenas(filtro: EstadoResenaFiltro) {
  return prisma.resena.findMany({
    where: filtro === 'TODOS' ? undefined : { estado: filtro as 'PENDIENTE' | 'VISIBLE' | 'OCULTA' },
    orderBy: { fecha: 'desc' },
    select: { id: true, comentario: true, fecha: true, calificacion: true, estado: true },
  })
}

export async function actualizarEstadoResena(
  id: number,
  estado: 'PENDIENTE' | 'VISIBLE' | 'OCULTA'
): Promise<{ error?: string; success?: boolean }> {
  if (!['PENDIENTE', 'VISIBLE', 'OCULTA'].includes(estado))
    return { error: 'Estado inválido.' }
  try {
    await prisma.resena.update({ where: { id }, data: { estado } })
    return { success: true }
  } catch {
    return { error: 'Error al actualizar la reseña.' }
  }
}

// ── Reseñas ───────────────────────────────────────────────────────────────────

export async function submitResena(formData: FormData) {
  const calificacion = parseInt(formData.get('calificacion') as string)
  const comentario = (formData.get('comentario') as string)?.trim()

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    throw new Error('Selecciona una calificación entre 1 y 5 estrellas')
  }

  if (!comentario || comentario.length < 10) {
    throw new Error('El comentario debe tener al menos 10 caracteres')
  }

  await prisma.resena.create({
    data: {
      calificacion,
      comentario,
      estado: 'PENDIENTE',
    },
  })

  revalidatePath('/')
}

// ── Autenticación ─────────────────────────────────────────────────────────────

export async function loginAction(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const usuario = (formData.get('usuario') as string)?.trim()
  const password = formData.get('password') as string

  if (!usuario || !password) {
    return { error: 'Ingresa usuario y contraseña.' }
  }

  const user = await prisma.user.findUnique({ where: { usuario } })

  if (!user) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  const passwordValida = await bcrypt.compare(password, user.password)

  if (!passwordValida) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('session', String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// ── Asistencias ───────────────────────────────────────────────────────────────

export async function registrarAsistencia(
  alumnoId: number
): Promise<{ error?: string; success?: boolean }> {
  const { fecha, hora } = ahoraEnCDMX()

  try {
    await prisma.asistencia.create({
      data: {
        alumnoId,
        fecha,
        horaEntrada: hora,
      },
    })
    return { success: true }
  } catch (e: unknown) {
    // Código P2002 = violación de unique constraint → ya registró hoy
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { error: 'La asistencia de hoy ya estaba registrada.' }
    }
    return { error: 'Error al registrar la asistencia. Intenta de nuevo.' }
  }
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function registrarPago(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const alumnoId        = parseInt(formData.get('alumnoId') as string)
  const montoRaw        = (formData.get('monto') as string)?.trim()
  const metodoPago      = (formData.get('metodoPago') as string)?.trim()
  const mesCorr         = (formData.get('mesCorrespondiente') as string)?.trim()
  const fechaPagoStr    = (formData.get('fechaPago') as string)?.trim()
  const notas           = (formData.get('notas') as string)?.trim() || null

  if (!alumnoId || isNaN(alumnoId))
    return { error: 'Alumno inválido.' }

  const monto = parseInt(montoRaw)
  if (isNaN(monto) || monto <= 0)
    return { error: 'El monto debe ser un número mayor a 0.' }

  if (!metodoPago || !['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].includes(metodoPago))
    return { error: 'Selecciona un método de pago válido.' }

  if (!mesCorr || !/^\d{4}-\d{2}$/.test(mesCorr))
    return { error: 'El mes correspondiente es inválido.' }

  if (!fechaPagoStr)
    return { error: 'La fecha de registro es requerida.' }

  const fechaPago = new Date(fechaPagoStr)
  if (isNaN(fechaPago.getTime()))
    return { error: 'La fecha de registro es inválida.' }

  try {
    const alumno = await prisma.alumno.findUnique({
      where: { id: alumnoId },
      select: { mensualidad: true },
    })
    if (!alumno) return { error: 'Alumno no encontrado.' }

    const estadoPago = monto >= Number(alumno.mensualidad) ? 'PAGADO' : 'ABONO'

    await prisma.pago.create({
      data: {
        alumnoId,
        monto,
        metodoPago:         metodoPago  as 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA',
        mesCorrespondiente: mesCorr,
        fechaPago,
        estadoPago:         estadoPago  as 'PAGADO' | 'ABONO',
        notas,
      },
    })

    return { success: true }
  } catch {
    return { error: 'Error al registrar el pago. Intenta de nuevo.' }
  }
}

// ── Reportes ──────────────────────────────────────────────────────────────────

export async function getAlumnosNuevos(
  modo: 'semana' | 'mes'
): Promise<{ label: string; total: number }[]> {
  const ahora = ahoraEnCDMX()
  const hoy   = ahora.fecha   // medianoche UTC = fecha CDMX

  if (modo === 'semana') {
    // Últimos 7 días (hoy inclusive)
    const inicio = new Date(hoy)
    inicio.setUTCDate(inicio.getUTCDate() - 6)

    const alumnos = await prisma.alumno.findMany({
      where: { fechaInscripcion: { gte: inicio, lte: hoy } },
      select: { fechaInscripcion: true },
    })

    // Construir mapa con los 7 días
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
    const map = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio)
      d.setUTCDate(d.getUTCDate() + i)
      const key = d.toISOString().slice(0, 10)
      map.set(key, 0)
    }
    for (const a of alumnos) {
      const key = a.fechaInscripcion.toISOString().slice(0, 10)
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
    }

    return Array.from(map.entries()).map(([iso, total]) => {
      const d = new Date(iso)
      const label = `${dias[d.getUTCDay()]} ${d.getUTCDate()}`
      return { label, total }
    })
  } else {
    // Últimos 12 meses (mes actual inclusive)
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const y = hoy.getUTCFullYear()
    const m = hoy.getUTCMonth() // 0-based

    const inicio = new Date(Date.UTC(y - (m < 11 ? 1 : 0), (m + 1) % 12, 1))
    const fin    = new Date(Date.UTC(y, m + 1, 1)) // primer día del mes siguiente

    const alumnos = await prisma.alumno.findMany({
      where: { fechaInscripcion: { gte: inicio, lt: fin } },
      select: { fechaInscripcion: true },
    })

    // Construir mapa con los 12 meses
    const map = new Map<string, number>()
    for (let i = 0; i < 12; i++) {
      const mi = (m + 1 + i) % 12
      const yi = y - (mi > m ? 1 : 0)
      const key = `${yi}-${String(mi + 1).padStart(2, '0')}`
      map.set(key, 0)
    }
    for (const a of alumnos) {
      const iso = a.fechaInscripcion.toISOString()
      const key = iso.slice(0, 7)
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
    }

    return Array.from(map.entries()).map(([key, total]) => {
      const mi = parseInt(key.slice(5, 7)) - 1
      return { label: meses[mi], total }
    })
  }
}

export async function getIngresoMensual(
  modo: 'semana' | 'mes'
): Promise<{ label: string; total: number }[]> {
  const { fecha: hoy } = ahoraEnCDMX()
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  if (modo === 'semana') {
    // 4 semanas: cada una de 7 días, la más reciente termina hoy
    const semanas: { label: string; inicio: Date; fin: Date }[] = []
    for (let i = 3; i >= 0; i--) {
      const fin   = new Date(hoy)
      fin.setUTCDate(fin.getUTCDate() - i * 7)
      const inicio = new Date(fin)
      inicio.setUTCDate(inicio.getUTCDate() - 6)

      const diaI = inicio.getUTCDate()
      const mesI = meses[inicio.getUTCMonth()]
      const diaF = fin.getUTCDate()
      const mesF = meses[fin.getUTCMonth()]
      const label = mesI === mesF
        ? `${diaI}-${diaF} ${mesF}`
        : `${diaI} ${mesI} - ${diaF} ${mesF}`

      semanas.push({ label, inicio, fin })
    }

    const pagos = await prisma.pago.findMany({
      where: { fechaPago: { gte: semanas[0].inicio, lte: semanas[3].fin } },
      select: { fechaPago: true, monto: true },
    })

    return semanas.map(({ label, inicio, fin }) => {
      const total = pagos
        .filter((p) => p.fechaPago >= inicio && p.fechaPago <= fin)
        .reduce((s, p) => s + p.monto, 0)
      return { label, total }
    })
  } else {
    // Últimos 12 meses
    const y = hoy.getUTCFullYear()
    const m = hoy.getUTCMonth()

    const inicio = new Date(Date.UTC(y - (m < 11 ? 1 : 0), (m + 1) % 12, 1))
    const fin    = new Date(Date.UTC(y, m + 1, 1))

    const pagos = await prisma.pago.findMany({
      where: { fechaPago: { gte: inicio, lt: fin } },
      select: { fechaPago: true, monto: true },
    })

    const map = new Map<string, number>()
    for (let i = 0; i < 12; i++) {
      const mi = (m + 1 + i) % 12
      const yi = y - (mi > m ? 1 : 0)
      const key = `${yi}-${String(mi + 1).padStart(2, '0')}`
      map.set(key, 0)
    }
    for (const p of pagos) {
      const key = p.fechaPago.toISOString().slice(0, 7)
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + p.monto)
    }

    return Array.from(map.entries()).map(([key, total]) => {
      const mi = parseInt(key.slice(5, 7)) - 1
      return { label: meses[mi], total }
    })
  }
}

export async function getReporteAsistencia(modo: 'semana' | 'mes'): Promise<{
  porDias:  { dias: number; alumnos: number }[]
  porFecha: { label: string; total: number }[]
}> {
  const { fecha: hoy } = ahoraEnCDMX()
  const dias = modo === 'semana' ? 7 : 30
  const dias_labels = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const meses_labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const inicio = new Date(hoy)
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1))

  const asistencias = await prisma.asistencia.findMany({
    where: { fecha: { gte: inicio, lte: hoy } },
    select: { alumnoId: true, fecha: true },
  })

  // ── Sección 1: cantidad de alumnos por días asistidos ──────────────────────
  const contadorPorAlumno = new Map<number, number>()
  for (const a of asistencias) {
    contadorPorAlumno.set(a.alumnoId, (contadorPorAlumno.get(a.alumnoId) ?? 0) + 1)
  }

  const contadorPorDias = new Map<number, number>()
  for (const diasAsistidos of contadorPorAlumno.values()) {
    contadorPorDias.set(diasAsistidos, (contadorPorDias.get(diasAsistidos) ?? 0) + 1)
  }

  const porDias = Array.from(contadorPorDias.entries())
    .map(([d, a]) => ({ dias: d, alumnos: a }))
    .sort((a, b) => b.dias - a.dias)

  // ── Sección 2: asistencias por fecha ──────────────────────────────────────
  const mapaFecha = new Map<string, number>()
  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio)
    d.setUTCDate(d.getUTCDate() + i)
    mapaFecha.set(d.toISOString().slice(0, 10), 0)
  }
  for (const a of asistencias) {
    const key = a.fecha.toISOString().slice(0, 10)
    if (mapaFecha.has(key)) mapaFecha.set(key, (mapaFecha.get(key) ?? 0) + 1)
  }

  const porFecha = Array.from(mapaFecha.entries()).map(([iso, total]) => {
    const d  = new Date(iso)
    const dd = d.getUTCDate()
    const label = modo === 'semana'
      ? `${dias_labels[d.getUTCDay()]} ${dd}`
      : `${dd} ${meses_labels[d.getUTCMonth()]}`
    return { label, total }
  })

  return { porDias, porFecha }
}

export type AlumnoPagoVencido = {
  id:               number
  nombre:           string
  apellido:         string
  mensualidad:      number
  diasVencido:      number
  ultimaAsistencia: string | null
  telefono:         string | null
  estado:           'ACTIVO' | 'INACTIVO' | 'BAJA'
}

export async function getPagoVencido(
  estadoFiltro: 'ACTIVO' | 'INACTIVO' | 'BAJA'
): Promise<AlumnoPagoVencido[]> {
  const { fecha: hoy } = ahoraEnCDMX()

  const alumnos = await prisma.alumno.findMany({
    where: { estado: estadoFiltro },
    select: {
      id:               true,
      nombre:           true,
      apellido:         true,
      mensualidad:      true,
      telefono:         true,
      estado:           true,
      fechaInscripcion: true,
      pagos: {
        orderBy: { fechaPago: 'desc' },
        take: 1,
        select: { fechaPago: true },
      },
      asistencias: {
        orderBy: { fecha: 'desc' },
        take: 1,
        select: { fecha: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  const MS_DIA = 86_400_000

  const resultado: AlumnoPagoVencido[] = []

  for (const a of alumnos) {
    // Referencia: último fechaPago o fechaInscripcion si nunca pagó
    const referencia: Date = a.pagos[0]?.fechaPago ?? a.fechaInscripcion

    // El pago cubre 29 días desde la referencia (día 30 = día 1 vencido)
    const fechaExpiracion = new Date(referencia)
    fechaExpiracion.setUTCDate(fechaExpiracion.getUTCDate() + 29)

    if (hoy < fechaExpiracion) continue   // aún vigente, no mostrar

    const diasVencido =
      Math.floor((hoy.getTime() - fechaExpiracion.getTime()) / MS_DIA) + 1

    resultado.push({
      id:               a.id,
      nombre:           a.nombre,
      apellido:         a.apellido,
      mensualidad:      Number(a.mensualidad),
      diasVencido,
      ultimaAsistencia: a.asistencias[0]?.fecha.toISOString().slice(0, 10) ?? null,
      telefono:         a.telefono ?? null,
      estado:           a.estado as 'ACTIVO' | 'INACTIVO' | 'BAJA',
    })
  }

  return resultado.sort((a, b) => b.diasVencido - a.diasVencido)
}

export async function actualizarEstadoAlumno(
  alumnoId: number,
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA'
): Promise<{ error?: string; success?: boolean }> {
  if (!['ACTIVO', 'INACTIVO', 'BAJA'].includes(estado))
    return { error: 'Estado inválido.' }
  try {
    await prisma.alumno.update({ where: { id: alumnoId }, data: { estado } })
    return { success: true }
  } catch {
    return { error: 'Error al actualizar el estado.' }
  }
}

// ── Alumnos ───────────────────────────────────────────────────────────────────

const NIVELES    = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'COMPETIDOR'] as const
const TURNOS     = ['MANANA', 'TARDE', 'NOCHE'] as const
const ESTADOS    = ['ACTIVO', 'INACTIVO', 'BAJA'] as const
const CATEGORIAS = [
  'MINIMOSMO','MOSCA','SUPERMOSCA','GALLO','SUPERGALLO','PLUMA','SUPERPLUMA',
  'LIGERO','SUPERLIGERO','WELTER','SUPERWELTER','MEDIANO','SUPERMEDIANO',
  'SEMIPESADO','CRUCERO','PESADO',
] as const

export async function actualizarDatosExtras(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const alumnoId      = parseInt(formData.get('alumnoId') as string)
  const nivel         = (formData.get('nivel')         as string)?.trim()
  const pesoKgRaw     = (formData.get('pesoKg')        as string)?.trim()
  const categoriaRaw  = (formData.get('categoriaPeso') as string)?.trim()
  const turno         = (formData.get('turno')         as string)?.trim()
  const estado        = (formData.get('estado')        as string)?.trim()

  if (isNaN(alumnoId)) return { error: 'Alumno inválido.' }
  if (!NIVELES.includes(nivel as typeof NIVELES[number]))  return { error: 'Nivel inválido.' }
  if (!TURNOS.includes(turno as typeof TURNOS[number]))    return { error: 'Turno inválido.' }
  if (!ESTADOS.includes(estado as typeof ESTADOS[number])) return { error: 'Estado inválido.' }

  const pesoKg = pesoKgRaw ? parseInt(pesoKgRaw) : null
  if (pesoKg !== null && (isNaN(pesoKg) || pesoKg <= 0))
    return { error: 'El peso debe ser un número mayor a 0.' }

  const categoriaPeso =
    categoriaRaw && CATEGORIAS.includes(categoriaRaw as typeof CATEGORIAS[number])
      ? categoriaRaw
      : null

  try {
    await prisma.alumno.update({
      where: { id: alumnoId },
      data: {
        nivel:         nivel         as typeof NIVELES[number],
        pesoKg,
        categoriaPeso: categoriaPeso as typeof CATEGORIAS[number] | null,
        turno:         turno         as typeof TURNOS[number],
        estado:        estado        as typeof ESTADOS[number],
      },
    })
    return { success: true }
  } catch {
    return { error: 'Error al guardar los datos. Intenta de nuevo.' }
  }
}

export async function actualizarAlumno(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const alumnoId    = parseInt(formData.get('alumnoId') as string)
  const nombre      = (formData.get('nombre')           as string)?.trim()
  const apellido    = (formData.get('apellido')         as string)?.trim()
  const fechaNac    = (formData.get('fechaNacimiento')  as string)?.trim()
  const telefono    = (formData.get('telefono')         as string)?.trim() || null
  const mensualidad = (formData.get('mensualidad')      as string)?.trim()

  if (isNaN(alumnoId))                   return { error: 'Alumno inválido.' }
  if (!nombre    || nombre.length < 2)   return { error: 'El nombre debe tener al menos 2 caracteres.' }
  if (!apellido  || apellido.length < 2) return { error: 'El apellido debe tener al menos 2 caracteres.' }
  if (!fechaNac)                         return { error: 'La fecha de nacimiento es requerida.' }

  const fecha = new Date(fechaNac)
  if (isNaN(fecha.getTime()) || fecha >= new Date())
    return { error: 'Ingresa una fecha de nacimiento válida.' }

  const montoMensualidad = parseFloat(mensualidad)
  if (isNaN(montoMensualidad) || montoMensualidad <= 0)
    return { error: 'La mensualidad debe ser un valor mayor a 0.' }

  try {
    await prisma.alumno.update({
      where: { id: alumnoId },
      data: { nombre, apellido, fechaNacimiento: fecha, telefono, mensualidad: montoMensualidad },
    })
    return { success: true }
  } catch {
    return { error: 'Error al actualizar los datos. Intenta de nuevo.' }
  }
}

export async function registrarProgreso(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const alumnoId        = parseInt(formData.get('alumnoId') as string)
  const pesoRaw         = (formData.get('pesoKg')           as string)?.trim()
  const tallaRaw        = (formData.get('tallaCm')          as string)?.trim()
  const grasaRaw        = (formData.get('porcentajeGrasa')  as string)?.trim()
  const imcRaw          = (formData.get('imc')              as string)?.trim()
  const notas           = (formData.get('notas')            as string)?.trim() || null

  if (isNaN(alumnoId)) return { error: 'Alumno inválido.' }

  const parse = (v: string) => v ? parseFloat(v) : null
  const pesoKg          = parse(pesoRaw)
  const tallaCm         = parse(tallaRaw)
  const porcentajeGrasa = parse(grasaRaw)
  const imc             = parse(imcRaw)

  if (pesoKg          !== null && (isNaN(pesoKg)          || pesoKg          <= 0   || pesoKg   > 999.99)) return { error: 'El peso debe estar entre 1 y 999 kg.' }
  if (tallaCm         !== null && (isNaN(tallaCm)         || tallaCm         <= 0   || tallaCm  > 999.99)) return { error: 'La talla debe estar entre 1 y 999 cm.' }
  if (porcentajeGrasa !== null && (isNaN(porcentajeGrasa) || porcentajeGrasa <  0   || porcentajeGrasa > 99.99)) return { error: 'El % de grasa debe estar entre 0 y 99.99.' }
  if (imc             !== null && (isNaN(imc)             || imc             <= 0   || imc       > 99.99)) return { error: 'El IMC debe estar entre 0.01 y 99.99. Verifica que la talla esté en centímetros.' }

  const { fecha } = ahoraEnCDMX()

  try {
    await prisma.progresoFisico.create({
      data: { alumnoId, fechaMedicion: fecha, pesoKg, tallaCm, porcentajeGrasa, imc, notas },
    })
    return { success: true }
  } catch (e) {
    console.error('[registrarProgreso]', e)
    return { error: 'Error al guardar el progreso. Intenta de nuevo.' }
  }
}

export async function registrarAlumno(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const nombre      = (formData.get('nombre')      as string)?.trim()
  const apellido    = (formData.get('apellido')    as string)?.trim()
  const fechaNac    = (formData.get('fechaNacimiento') as string)?.trim()
  const telefono    = (formData.get('telefono')    as string)?.trim() || null
  const mensualidad = (formData.get('mensualidad') as string)?.trim()

  // Validaciones
  if (!nombre || nombre.length < 2)
    return { error: 'El nombre debe tener al menos 2 caracteres.' }

  if (!apellido || apellido.length < 2)
    return { error: 'El apellido debe tener al menos 2 caracteres.' }

  if (!fechaNac)
    return { error: 'La fecha de nacimiento es requerida.' }

  const fecha = new Date(fechaNac)
  if (isNaN(fecha.getTime()) || fecha >= new Date())
    return { error: 'Ingresa una fecha de nacimiento válida.' }

  const montoMensualidad = parseFloat(mensualidad)
  if (isNaN(montoMensualidad) || montoMensualidad <= 0)
    return { error: 'La mensualidad debe ser un valor mayor a 0.' }

  try {
    await prisma.alumno.create({
      data: {
        nombre,
        apellido,
        fechaNacimiento: fecha,
        telefono,
        mensualidad: montoMensualidad,
      },
    })
    return { success: true }
  } catch {
    return { error: 'Ocurrió un error al guardar. Intenta de nuevo.' }
  }
}
