/**
 * Devuelve fecha y hora actuales en America/Mexico_City.
 *
 * Los valores se codifican como UTC para que Prisma los almacene
 * correctamente en columnas @db.Date y @db.Time (sin zona horaria),
 * independientemente de la zona del servidor.
 */
export function ahoraEnCDMX(): { fecha: Date; hora: Date } {
  const now = new Date()

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  })

  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  )

  const y  = parseInt(parts.year)
  const mo = parseInt(parts.month) - 1   // 0-based
  const d  = parseInt(parts.day)
  const h  = parseInt(parts.hour) % 24   // Intl puede devolver 24 a medianoche
  const mi = parseInt(parts.minute)
  const s  = parseInt(parts.second)

  return {
    fecha: new Date(Date.UTC(y, mo, d)),
    hora:  new Date(Date.UTC(y, mo, d, h, mi, s)),
  }
}

/**
 * Devuelve la fecha de hoy en CDMX como Date a medianoche UTC,
 * para usarse en consultas Prisma sobre columnas @db.Date.
 */
export function hoyEnCDMX(): Date {
  return ahoraEnCDMX().fecha
}
