import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    await dbConnect()
    const { id: sessionId, serviceId } = await params

    const session = await Session.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const serviceIndex = session.services.findIndex(
      (service: any) => service.serviceId === serviceId
    )

    if (serviceIndex === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const service = session.services[serviceIndex]
    
    // Only time-based services can be paused
    if (service.serviceType !== "time-based") {
      return NextResponse.json(
        { error: "Only time-based services can be paused" },
        { status: 400 }
      )
    }

    // Check if service is already paused
    if (service.isPaused) {
      return NextResponse.json(
        { error: "Service is already paused" },
        { status: 400 }
      )
    }

    // Pause the service
    session.services[serviceIndex].isPaused = true
    session.services[serviceIndex].pausedTime = new Date()

    await session.save()
    const response = NextResponse.json(session)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error pausing service:", error)
    return NextResponse.json(
      { error: "Failed to pause service" },
      { status: 500 }
    )
  }
}