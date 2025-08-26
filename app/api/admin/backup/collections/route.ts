import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/jwt-edge'
import ActivityLog from '@/models/ActivityLog'
import Customer from '@/models/Customer'
import Operator from '@/models/Operator'
import Service from '@/models/Service'
import Category from '@/models/Category'
import Session from '@/models/Session'
import Settings from '@/models/Settings'
import PasswordReset from '@/models/PasswordReset'
import UserSession from '@/models/UserSession'

const collections = [
  { name: 'customers', model: Customer, label: 'مشتریان', description: 'اطلاعات مشتریان' },
  { name: 'operators', model: Operator, label: 'اپراتورها', description: 'اطلاعات کاربران سیستم' },
  { name: 'services', model: Service, label: 'سرویس‌ها', description: 'لیست سرویس‌های ارائه شده' },
  { name: 'categories', model: Category, label: 'دسته‌بندی‌ها', description: 'دسته‌بندی سرویس‌ها' },
  { name: 'sessions', model: Session, label: 'جلسات', description: 'جلسات مشتریان' },
  { name: 'settings', model: Settings, label: 'تنظیمات', description: 'تنظیمات سیستم' },
  { name: 'activityLogs', model: ActivityLog, label: 'لاگ‌های فعالیت', description: 'سوابق فعالیت‌های سیستم' },
  { name: 'passwordResets', model: PasswordReset, label: 'بازنشانی رمز عبور', description: 'درخواست‌های بازنشانی رمز عبور' },
  { name: 'userSessions', model: UserSession, label: 'جلسات کاربری', description: 'جلسات فعال کاربران' }
]

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const payload = await verifyTokenFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = payload
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Return available collections
    const availableCollections = collections.map(({ name, label, description }) => ({
      name,
      label,
      description
    }))

    return NextResponse.json({
      success: true,
      collections: availableCollections
    })

  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}