import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configs = await db.whiteLabelConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: configs })
  } catch (error) {
    console.error('White-label fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch white-label configs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })

    if (!user || user.plan !== 'team') {
      return NextResponse.json(
        { error: 'White-label reports require a Team plan. Please upgrade to customize your reports.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyName, logoUrl, primaryColor, accentColor, customDomain, footerText } = body

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const config = await db.whiteLabelConfig.create({
      data: {
        userId: session.user.id,
        companyName,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#7c3aed',
        accentColor: accentColor || '#6366f1',
        customDomain: customDomain || null,
        footerText: footerText || null,
      },
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('White-label creation error:', error)
    return NextResponse.json({ error: 'Failed to create white-label config' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, companyName, logoUrl, primaryColor, accentColor, customDomain, footerText, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const config = await db.whiteLabelConfig.findUnique({ where: { id } })
    if (!config || config.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await db.whiteLabelConfig.update({
      where: { id },
      data: {
        companyName,
        logoUrl: logoUrl || null,
        primaryColor,
        accentColor,
        customDomain: customDomain || null,
        footerText: footerText || null,
        isActive: isActive ?? config.isActive,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('White-label update error:', error)
    return NextResponse.json({ error: 'Failed to update white-label config' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

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
