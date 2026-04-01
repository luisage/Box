import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const userId = parseInt(cookieStore.get('session')?.value ?? '')

  let userName = 'Admin'
  if (!isNaN(userId)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { usuario: true } })
    if (user?.usuario) userName = user.usuario
  }

  return <DashboardShell userName={userName}>{children}</DashboardShell>
}
