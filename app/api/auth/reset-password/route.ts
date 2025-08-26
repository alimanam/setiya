import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Operator from "@/models/Operator"
import PasswordReset from "@/models/PasswordReset"
import { hashPassword } from "@/lib/password"
import { withActivityLogging } from "@/middleware/activity-logger"

export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    
    const { token, password } = await request.json()
    
    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: "توکن و رمز عبور الزامی است" },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل 6 کاراکتر باشد" },
        { status: 400 }
      )
    }
    
    // Find and validate reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })
    
    if (!resetRecord) {
      return NextResponse.json(
        { error: "توکن نامعتبر یا منقضی شده است" },
        { status: 400 }
      )
    }
    
    // Find the operator
    const operator = await Operator.findOne({ email: resetRecord.email })
    if (!operator) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(password)
    
    // Update operator password
    await Operator.findByIdAndUpdate(operator._id, {
      password: hashedPassword
    })
    
    // Mark token as used
    await PasswordReset.findByIdAndUpdate(resetRecord._id, {
      isUsed: true
    })
    
    // Invalidate all other tokens for this email
    await (PasswordReset as any).invalidateUserTokens(resetRecord.email)
    
    return NextResponse.json(
      { message: "رمز عبور با موفقیت تغییر یافت" },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json(
      { error: "خطا در تغییر رمز عبور" },
      { status: 500 }
    )
  }
})

// GET endpoint to verify token validity
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: "توکن الزامی است" },
        { status: 400 }
      )
    }
    
    // Check if token is valid
    const resetRecord = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })
    
    if (!resetRecord) {
      return NextResponse.json(
        { valid: false, error: "توکن نامعتبر یا منقضی شده است" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { valid: true, email: resetRecord.email },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("Error in token verification:", error)
    return NextResponse.json(
      { error: "خطا در بررسی توکن" },
      { status: 500 }
    )
  }
}