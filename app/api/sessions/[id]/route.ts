import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import { logDatabaseOperation } from "@/middleware/activity-logger"
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from "@/lib/activity-logger"
import { verifyTokenFromRequest } from "@/lib/jwt-edge"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params

    const session = await Session.findById(id)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const response = NextResponse.json(session)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { id } = await params

    const session = await Session.findByIdAndUpdate(id, body, { new: true })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const response = NextResponse.json(session)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    
    // Get operator info from JWT token
    const tokenPayload = await verifyTokenFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Find session before deletion to get session details for logging
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    
    // Delete the session
    await Session.findByIdAndDelete(id)

    // Log the session cancellation activity
    await logActivity({
      operatorId: tokenPayload.userId,
      operatorUsername: tokenPayload.username,
      action: LOG_ACTIONS.CANCEL_SESSION,
      resource: LOG_RESOURCES.SESSION,
      resourceId: id,
      details: {
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        startTime: session.startTime,
        services: session.services?.map((s: any) => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          quantity: s.quantity
        })) || [],
        totalCost: session.totalCost || 0,
        cancelledAt: new Date()
      },
      request,
      status: 'success'
    })

    const response = NextResponse.json({ message: "Session deleted successfully" })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error cancelling session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
