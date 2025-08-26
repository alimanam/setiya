import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import UserSession from "@/models/UserSession"
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt-edge"
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    // Get the JWT token from the request
    const token = extractTokenFromRequest(request)
    let operatorInfo = null
    
    if (token) {
      try {
        // Get operator info from token before deactivating
        operatorInfo = await verifyToken(token)
      } catch (error) {
        console.error('Error verifying token for logout logging:', error)
      }
      
      // Deactivate the session in the database
      await UserSession.updateOne(
        { token, isActive: true },
        { isActive: false }
      )
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "خروج موفقیت‌آمیز بود"
    })
    
    // Clear the HTTP-only cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })
    
    // Log successful logout
    if (operatorInfo) {
      await logActivity({
        operatorId: operatorInfo.userId,
        operatorUsername: operatorInfo.username,
        action: LOG_ACTIONS.LOGOUT,
        resource: LOG_RESOURCES.AUTH,
        details: {
          logoutTime: new Date(),
          sessionId: token ? token.substring(0, 10) + '...' : 'unknown'
        },
        request,
        status: 'success'
      })
    }
    
    return response
    
  } catch (error) {
    console.error("Logout error:", error)
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json(
      { error: "خطا در خروج از سیستم" },
      { status: 500 }
    )
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })
    
    return response
  }
}