import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Settings from '@/models/Settings'
import ActivityLog from '@/models/ActivityLog'
import { verifyTokenFromRequest } from '@/lib/jwt'
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from '@/lib/activity-logger'

// GET - Get current log retention setting
export async function GET(request: NextRequest) {
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

    // Get current log retention setting
    const retentionSetting = await Settings.findOne({ key: 'log_retention_days' })
    const retentionDays = retentionSetting ? parseInt(retentionSetting.value) : 180

    return NextResponse.json({
      success: true,
      data: {
        retentionDays,
        retentionOption: getRetentionOption(retentionDays)
      }
    })
  } catch (error) {
    console.error('Error getting log retention setting:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

// PUT - Update log retention setting
export async function PUT(request: NextRequest) {
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

    const { retentionOption } = await request.json()
    
    // Validate retention option
    const validOptions = ['1_month', '3_months', '6_months', '1_year', 'never']
    if (!validOptions.includes(retentionOption)) {
      return NextResponse.json(
        { success: false, message: 'گزینه نگهداری نامعتبر است' },
        { status: 400 }
      )
    }

    const retentionDays = getRetentionDays(retentionOption)
    
    // Update or create the setting
    await Settings.findOneAndUpdate(
      { key: 'log_retention_days' },
      { 
        key: 'log_retention_days',
        value: retentionDays.toString(),
        description: 'مدت زمان نگهداری لاگ‌های فعالیت (روز)'
      },
      { upsert: true, new: true }
    )

    // Update TTL for existing logs if not set to never
    if (retentionOption !== 'never') {
      await ActivityLog.updateTTLFromSettings()
    }

    // Log this admin action
    await logActivity({
      operatorId: decoded.userId,
      operatorUsername: decoded.username,
      action: LOG_ACTIONS.UPDATE,
      resource: LOG_RESOURCES.SETTINGS,
      resourceId: 'log_retention_days',
      details: {
        oldValue: 'unknown',
        newValue: retentionOption,
        retentionDays
      },
      request
    })

    return NextResponse.json({
      success: true,
      message: 'تنظیمات نگهداری لاگ‌ها با موفقیت به‌روزرسانی شد',
      data: {
        retentionDays,
        retentionOption
      }
    })
  } catch (error) {
    console.error('Error updating log retention setting:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}

// Helper function to convert retention option to days
function getRetentionDays(option: string): number {
  switch (option) {
    case '1_month':
      return 30
    case '3_months':
      return 90
    case '6_months':
      return 180
    case '1_year':
      return 365
    case 'never':
      return -1 // Special value for never expire
    default:
      return 180 // Default to 6 months
  }
}

// Helper function to convert days to retention option
function getRetentionOption(days: number): string {
  switch (days) {
    case 30:
      return '1_month'
    case 90:
      return '3_months'
    case 180:
      return '6_months'
    case 365:
      return '1_year'
    case -1:
      return 'never'
    default:
      return '6_months' // Default to 6 months
  }
}