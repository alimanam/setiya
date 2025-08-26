import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/jwt-edge'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const tokenResult = await verifyTokenFromRequest(request)
  if (!tokenResult || tokenResult.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'دسترسی غیرمجاز - نیاز به دسترسی ادمین' },
      { status: 401 }
    )
  }
  try {
    const { backupUrl, botToken, chatId } = await request.json()

    if (!backupUrl || !botToken || !chatId) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای مورد نیاز ارسال نشده است' },
        { status: 400 }
      )
    }

    // استخراج backupId از URL
    const urlParams = new URLSearchParams(backupUrl.split('?')[1])
    const backupId = urlParams.get('backupId')
    
    if (!backupId) {
      return NextResponse.json(
        { success: false, error: 'شناسه بک‌آپ در URL یافت نشد' },
        { status: 400 }
      )
    }

    // ساخت مسیر فایل با استفاده از backupId
    const fileName = `${backupId}.zip`
    const filePath = path.join(process.cwd(), 'temp', 'backups', fileName)

    // بررسی وجود فایل
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل بک‌آپ یافت نشد' },
        { status: 404 }
      )
    }

    // خواندن فایل
    const fileBuffer = fs.readFileSync(filePath)
    
    // ایجاد FormData برای ارسال فایل
    const formData = new FormData()
    const fileBlob = new Blob([fileBuffer], { type: 'application/zip' })
    const displayFileName = `backup_${new Date().toISOString().split('T')[0]}_${backupId.split('_')[1]}.zip`
    formData.append('document', fileBlob, displayFileName)
    formData.append('chat_id', chatId)
    formData.append('caption', `🗂 فایل بک‌آپ سیستم\n📅 تاریخ: ${new Date().toLocaleDateString('fa-IR')}\n⏰ ساعت: ${new Date().toLocaleTimeString('fa-IR')}`)

    // ارسال فایل به تلگرام
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    })

    const telegramResult = await telegramResponse.json() as any

    if (telegramResult.ok) {
      return NextResponse.json({
        success: true,
        message: 'فایل بک‌آپ با موفقیت به تلگرام ارسال شد'
      })
    } else {
      console.error('Telegram API Error:', telegramResult)
      return NextResponse.json(
        { 
          success: false, 
          error: `خطا در ارسال به تلگرام: ${telegramResult.description || 'خطای نامشخص'}` 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error sending backup to Telegram:', error)
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}