import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Operator from "@/models/Operator"
import UserSession from "@/models/UserSession"
import { generateToken } from "@/lib/jwt-edge"
import { verifyPassword } from "@/lib/password"
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "نام کاربری و رمز عبور الزامی است" },
        { status: 400 }
      )
    }
    
    // Find operator by username
    const operator = await Operator.findOne({ username })
    
    if (!operator) {
      return NextResponse.json(
        { error: "نام کاربری یا رمز عبور اشتباه است" },
        { status: 401 }
      )
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, operator.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "نام کاربری یا رمز عبور اشتباه است" },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const tokenPayload = {
      userId: operator._id.toString(),
      username: operator.username,
      role: operator.role || 'operator'
    }
    
    const token = await generateToken(tokenPayload)
    
    // Get client info for session tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'Unknown'
    
    // Clean up expired sessions
    await (UserSession as any).cleanupExpiredSessions()
    
    // Deactivate existing sessions for this user (optional - for single session per user)
    // await (UserSession as any).deactivateUserSessions(operator._id.toString())
    
    // Create new session record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    await UserSession.create({
      userId: operator._id.toString(),
      token,
      userAgent,
      ipAddress,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    })
    
    // Return operator info (without password)
    const { password: _, ...operatorData } = operator.toObject()
    
    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      operator: operatorData,
      message: "ورود موفقیت‌آمیز بود"
    })
    
    // Set HTTP-only cookie with JWT token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    })
    
    // Log successful login
    await logActivity({
      operatorId: operator._id.toString(),
      operatorUsername: operator.username,
      action: LOG_ACTIONS.LOGIN,
      resource: LOG_RESOURCES.AUTH,
      details: {
        loginTime: new Date(),
        sessionId: token.substring(0, 10) + '...'
      },
      request,
      status: 'success'
    })
    
    return response
    
  } catch (error) {
    console.error("Login error:", error)
    
    // Log failed login attempt if we have username
    try {
      const { username } = await request.clone().json()
      if (username) {
        await logActivity({
          operatorId: 'unknown',
          operatorUsername: username,
          action: LOG_ACTIONS.LOGIN,
          resource: LOG_RESOURCES.AUTH,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            loginTime: new Date()
          },
          request,
          status: 'failed'
        })
      }
    } catch (logError) {
      console.error('Error logging failed login:', logError)
    }
    
    return NextResponse.json(
      { error: "خطا در ورود به سیستم" },
      { status: 500 }
    )
  }
}