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

    const memberships = await db.teamMember.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        team: {
          include: {
            members: {
              where: { isActive: true },
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
      },
    })

    const teams = memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      description: m.team.description,
      role: m.role,
      ownerId: m.team.ownerId,
      members: m.team.members.map((tm) => ({
        id: tm.id,
        role: tm.role,
        user: tm.user,
      })),
      createdAt: m.team.createdAt,
    }))

    return NextResponse.json({ success: true, data: teams })
  } catch (error) {
    console.error('Teams fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
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
        { error: 'Team features require a Team plan. Please upgrade to create teams.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Handle different actions based on `action` field
    const action = body.action || 'create'

    if (action === 'create') {
      const { name, description } = body
      if (!name) {
        return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

      const team = await db.team.create({
        data: {
          name,
          slug,
          description: description || null,
          ownerId: session.user.id,
          members: {
            create: { userId: session.user.id, role: 'owner', isActive: true, joinedAt: new Date() },
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        },
      })

      return NextResponse.json({ success: true, data: team })
    }

    if (action === 'invite') {
      const { teamId, email, role = 'member' } = body
      if (!teamId || !email) {
        return NextResponse.json({ error: 'Team ID and email are required' }, { status: 400 })
      }

      const membership = await db.teamMember.findFirst({
        where: { teamId, userId: session.user.id, isActive: true, role: { in: ['owner', 'admin'] } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Only team owners and admins can invite members' }, { status: 403 })
      }

      const memberCount = await db.teamMember.count({ where: { teamId, isActive: true } })
      if (memberCount >= 10) {
        return NextResponse.json({ error: 'Team member limit reached (10 per team)' }, { status: 400 })
      }

      let invitedUser = await db.user.findUnique({ where: { email } })
      if (!invitedUser) {
        invitedUser = await db.user.create({ data: { email, name: email.split('@')[0], plan: 'free' } })
      }

      const existingMember = await db.teamMember.findFirst({ where: { teamId, userId: invitedUser.id } })
      if (existingMember) {
        if (existingMember.isActive) {
          return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
        }
        await db.teamMember.update({ where: { id: existingMember.id }, data: { isActive: true, role, joinedAt: new Date() } })
        return NextResponse.json({ success: true, data: { reactivated: true } })
      }

      const teamMember = await db.teamMember.create({
        data: { teamId, userId: invitedUser.id, role, isActive: true, joinedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      })

      return NextResponse.json({ success: true, data: teamMember })
    }

    if (action === 'remove') {
      const { teamId, memberId } = body
      if (!teamId || !memberId) {
        return NextResponse.json({ error: 'Team ID and member ID are required' }, { status: 400 })
      }

      const membership = await db.teamMember.findFirst({
        where: { teamId, userId: session.user.id, isActive: true, role: { in: ['owner', 'admin'] } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Only team owners and admins can remove members' }, { status: 403 })
      }

      const memberToRemove = await db.teamMember.findUnique({ where: { id: memberId } })
      if (!memberToRemove || memberToRemove.teamId !== teamId) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      if (memberToRemove.role === 'owner') {
        return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 })
      }

      await db.teamMember.update({ where: { id: memberId }, data: { isActive: false } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Team error:', error)
    return NextResponse.json({ error: 'Failed to process team request' }, { status: 500 })
  }
}
