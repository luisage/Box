import { prisma } from '@/app/lib/prisma'
import { hoyEnCDMX } from '@/app/lib/timezone'
import AlumnosClient, { type AlumnoRow } from '@/app/dashboard/alumnos/AlumnosClient'

export const dynamic = 'force-dynamic'

export default async function AlumnosPage() {
  const hoy = hoyEnCDMX()

  const alumnos = await prisma.alumno.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      pagos: {
        orderBy: { fechaPago: 'desc' },
        take: 1,
        select: { estadoPago: true },
      },
      asistencias: {
        where: { fecha: hoy },
        take: 1,
        select: { id: true },
      },
    },
  })

  const rows: AlumnoRow[] = alumnos.map((a) => ({
    id:               a.id,
    nombre:           a.nombre,
    apellido:         a.apellido,
    telefono:         a.telefono      ?? null,
    fechaInscripcion: a.fechaInscripcion.toISOString(),
    fechaNacimiento:  a.fechaNacimiento.toISOString(),
    mensualidad:      Number(a.mensualidad),
    ultimoPagoEstado: a.pagos[0]?.estadoPago ?? null,
    asistenciaHoy:    a.asistencias.length > 0,
    // Datos extras
    nivel:            a.nivel,
    pesoKg:           a.pesoKg        ?? null,
    categoriaPeso:    a.categoriaPeso ?? null,
    turno:            a.turno,
    estado:           a.estado,
  }))

  return <AlumnosClient alumnos={rows} />
}
