import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-edge'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { imageData, botToken, chatId, customerName } = await request.json()

    if (!imageData || !botToken || !chatId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Convert base64 image data to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Send to Telegram
    const formData = new FormData()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    const fileName = `invoice_${customerName || 'customer'}_${new Date().toISOString().split('T')[0]}.png`
    
    formData.append('photo', imageBlob, fileName)
    formData.append('chat_id', chatId)
    formData.append('caption', `🧾 فاکتور جلسه\n👤 مشتری: ${customerName || 'نامشخص'}\n📅 تاریخ: ${new Date().toLocaleDateString('fa-IR')}\n⏰ ساعت: ${new Date().toLocaleTimeString('fa-IR')}`)

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    })

    const telegramResult = await telegramResponse.json() as any

    if (telegramResult.ok) {
      return NextResponse.json({
        success: true,
        message: 'فاکتور با موفقیت به تلگرام ارسال شد'
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
    console.error('Error sending invoice to Telegram:', error)
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}