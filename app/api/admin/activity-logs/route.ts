import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import ActivityLog from '@/models/ActivityLog'
import Operator from '@/models/Operator'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 })
    }

    await dbConnect()

    // Check if user is admin
    const operator = await Operator.findById(decoded.userId)
    if (!operator || operator.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی مجاز نیست - فقط ادمین' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'timestamp'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const action = searchParams.get('action') || ''
    const resource = searchParams.get('resource') || ''
    const operatorUsername = searchParams.get('operatorUsername') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build filter query
    const filter: any = {}

    if (search) {
      filter.$or = [
        { operatorUsername: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } }
      ]
    }

    if (action) {
      filter.action = action
    }

    if (resource) {
      filter.resource = resource
    }

    if (operatorUsername) {
      filter.operatorUsername = operatorUsername
    }

    if (status) {
      filter.status = status
    }

    if (dateFrom || dateTo) {
      filter.timestamp = {}
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filter.timestamp.$gte = fromDate
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        filter.timestamp.$lte = toDate
      }
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await ActivityLog.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / limit)

    // Get activity logs
    const logs = await ActivityLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get unique values for filters
    const [actions, resources, operators] = await Promise.all([
      ActivityLog.distinct('action'),
      ActivityLog.distinct('resource'),
      ActivityLog.distinct('operatorUsername')
    ])

    return NextResponse.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        actions: actions.sort(),
        resources: resources.sort(),
        operators: operators.sort(),
        statuses: ['success', 'failed']
      }
    })

  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت لاگ‌های فعالیت' },
      { status: 500 }
    )
  }
}