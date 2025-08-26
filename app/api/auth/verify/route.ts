import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import UserSession from "@/models/UserSession"
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt-edge"
import Operator from "@/models/Operator"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Get the JWT token from the request
    const token = extractTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "No token provided" },
        { status: 401 }
      )
    }
    
    // Verify the JWT token
    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid token" },
        { status: 401 }
      )
    }
    
    // Check if the session is still active in the database
    const session = await UserSession.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "Session not found or expired" },
        { status: 401 }
      )
    }
    
    // Update last accessed time
    await UserSession.updateOne(
      { _id: session._id },
      { lastAccessedAt: new Date() }
    )
    
    // Get user information
    const operator = await Operator.findById(payload.userId).select('-password')
    
    if (!operator) {
      return NextResponse.json(
        { authenticated: false, error: "User not found" },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: operator._id,
        username: operator.username,
        role: operator.role || 'operator'
      }
    })
    
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json(
      { authenticated: false, error: "Verification failed" },
      { status: 500 }
    )
  }
}