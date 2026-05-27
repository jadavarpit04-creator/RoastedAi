import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify user is team owner or admin
    const membership = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id, isActive: true, role: { in: ['owner', 'admin'] } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Only team owners and admins can invite members' }, { status: 403 })
    }

    // Check member limit
    const memberCount = await db.teamMember.count({
      where: { teamId, isActive: true },
    })

    if (memberCount >= 10) {
      return NextResponse.json(
        { error: 'Team member limit reached (10 members per team)' },
        { status: 400 }
      )
    }

    // Find or create user by email
    let invitedUser = await db.user.findUnique({ where: { email } })

    if (!invitedUser) {
      // Create a placeholder user for the invitation
      invitedUser = await db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          plan: 'free',
        },
      })
    }

    // Check if already a member
    const existingMember = await db.teamMember.findFirst({
      where: { teamId, userId: invitedUser.id },
    })

    if (existingMember) {
      if (existingMember.isActive) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
      }
      // Reactivate
      await db.teamMember.update({
        where: { id: existingMember.id },
        data: { isActive: true, role, joinedAt: new Date() },
      })
      return NextResponse.json({ success: true, data: { reactivated: true } })
    }

    // Add member
    const teamMember = await db.teamMember.create({
      data: {
        teamId,
        userId: invitedUser.id,
        role,
        isActive: true,
        joinedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json({ success: true, data: teamMember })
  } catch (error) {
    console.error('Team member invite error:', error)
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 })
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

    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Verify user is team owner or admin
    const membership = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id, isActive: true, role: { in: ['owner', 'admin'] } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Only team owners and admins can remove members' }, { status: 403 })
    }

    const memberToRemove = await db.teamMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToRemove.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 })
    }

    await db.teamMember.update({
      where: { id: memberId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team member removal error:', error)
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
  }
}
