import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  if (!sessionId) return null

  const userId = parseInt(sessionId)
  if (isNaN(userId)) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, usuario: true, nombre: true, apellido: true, role: true },
  })

  return user ?? null
}
