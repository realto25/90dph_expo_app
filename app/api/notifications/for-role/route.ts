import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/for-role?role=CLIENT
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  if (!role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }

  // Get all notifications for this role, ordered by most recent
  const notifications = await prisma.notification.findMany({
    where: { targetRole: role },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      message: true,
      createdAt: true,
      targetRole: true,
    },
  });

  return NextResponse.json({ notifications });
}
