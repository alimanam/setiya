import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Operator from "@/models/Operator"
import PasswordReset from "@/models/PasswordReset"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"
import { withActivityLogging } from "@/middleware/activity-logger"

export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    
    const { email } = await request.json()
    
    // Validate email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "ایمیل الزامی است" },
        { status: 400 }
      )
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "فرمت ایمیل صحیح نیست" },
        { status: 400 }
      )
    }
    
    // Check if operator exists
    const operator = await Operator.findOne({ email: email.toLowerCase() })
    if (!operator) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { message: "اگر ایمیل در سیستم موجود باشد، لینک بازیابی ارسال خواهد شد" },
        { status: 200 }
      )
    }
    
    // Clean up expired tokens
    await (PasswordReset as any).cleanupExpired()
    
    // Invalidate existing tokens for this email
    await (PasswordReset as any).invalidateUserTokens(email.toLowerCase())
    
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Create password reset record (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    await PasswordReset.create({
      email: email.toLowerCase(),
      token: resetToken,
      expiresAt,
      isUsed: false
    })
    
    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken)
    
    if (!emailSent) {
      console.error('Failed to send password reset email to:', email)
      // Don't reveal email sending failure to user for security
    }
    
    return NextResponse.json(
      { message: "اگر ایمیل در سیستم موجود باشد، لینک بازیابی ارسال خواهد شد" },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "خطا در پردازش درخواست" },
      { status: 500 }
    )
  }
})