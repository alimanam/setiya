import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ActivityLog from '@/models/ActivityLog'
import { verifyTokenFromRequest } from '@/lib/jwt'
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from '@/lib/activity-logger'

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    // Verify admin authentication
    const decoded = verifyTokenFromRequest(request)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'احراز هویت مورد نیاز است' },
        { status: 401 }
      )
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'دسترسی مجاز نیست' },
        { status: 403 }
      )
    }

    // Get count before deletion for logging
    const countBeforeDeletion = await ActivityLog.countDocuments()

    // Delete all activity logs
    const result = await ActivityLog.deleteMany({})

    // Log this admin action
    await logActivity({
      operatorId: decoded.userId,
      operatorUsername: decoded.username,
      action: LOG_ACTIONS.DELETE,
      resource: LOG_RESOURCES.SETTINGS,
      details: {
        action: 'delete_all_activity_logs',
        deletedCount: result.deletedCount,
        countBeforeDeletion
      },
      request,
      status: 'success'
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} لاگ با موفقیت حذف شد`,
      deletedCount: result.deletedCount
    })

  } catch (error) {
    console.error('Error deleting all activity logs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف لاگ‌ها' },
      { status: 500 }
    )
  }
}