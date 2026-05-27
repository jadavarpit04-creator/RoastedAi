import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const config = await db.whiteLabelConfig.findUnique({ where: { id } })
    if (!config || config.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await db.whiteLabelConfig.update({
      where: { id },
      data: {
        companyName: body.companyName,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        customDomain: body.customDomain || null,
        footerText: body.footerText || null,
        isActive: body.isActive ?? config.isActive,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('White-label update error:', error)
    return NextResponse.json({ error: 'Failed to update white-label config' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const config = await db.whiteLabelConfig.findUnique({ where: { id } })
    if (!config || config.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.whiteLabelConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('White-label deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete white-label config' }, { status: 500 })
  }
}
