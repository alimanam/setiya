import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import Service from "@/models/Service"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { id } = await params
    const { serviceId, quantity = 1 } = body

    // Find the session
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Find the service
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Check if service is already in the session
    const existingService = session.services.find((s: any) => s.serviceId.toString() === serviceId)
    if (existingService) {
      return NextResponse.json({ error: "Service already exists in this session" }, { status: 400 })
    }

    // Add service to session
    const newService = {
      serviceId,
      serviceName: service.name,
      serviceType: service.type,
      price: service.price,
      quantity,
      startTime: new Date(),
      totalCost: service.type === "time-based" ? 0 : service.price * quantity, // Time-based services start with 0 cost
      status: service.type === "time-based" ? "active" : "completed" // Set initial status
    }

    session.services.push(newService)
    
    // Update total cost using stored database values only
    session.totalCost = session.services.reduce((total: number, s: any) => {
      // Use stored totalCost from database for all services
      return total + (s.totalCost || 0)
    }, 0)

    await session.save()

    const response = NextResponse.json(session)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error adding service to session:", error)
    return NextResponse.json({ error: "Failed to add service to session" }, { status: 500 })
  }
}