import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, serviceId: string }> }) {
  try {
    await dbConnect()
    const { id, serviceId } = await params

    // Find the session
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Find the service in the session
    const serviceIndex = session.services.findIndex((s: any) => s.serviceId.toString() === serviceId)
    if (serviceIndex === -1) {
      return NextResponse.json({ error: "Service not found in this session" }, { status: 404 })
    }

    // Remove the service
    session.services.splice(serviceIndex, 1)
    
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
    console.error("Error removing service from session:", error)
    return NextResponse.json({ error: "Failed to remove service from session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string, serviceId: string }> }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { id, serviceId } = await params
    const { action, quantity, startTime, endTime } = body

    // Find the session
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Find the service in the session
    const service = session.services.find((s: any) => s.serviceId.toString() === serviceId)
    if (!service) {
      return NextResponse.json({ error: "Service not found in this session" }, { status: 404 })
    }

    // Handle different types of updates
    if (action === "pause") {
      if (service.status === "paused") {
        return NextResponse.json({ error: "Service is already paused" }, { status: 400 })
      }
      
      // Calculate and store current duration when pausing
      const now = new Date()
      const start = service.startTime ? new Date(service.startTime) : now
      const currentDuration = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
      service.duration = Math.max(currentDuration - (service.totalPausedDuration || 0), 0)
      
      // Update totalCost for time-based services when pausing (integer minutes, <1 minute => 0)
      if (service.serviceType === "time-based") {
        const minutes = Math.floor(service.duration || 0)
        service.totalCost = minutes < 1 ? 0 : Math.floor(minutes * (service.price || 0))
      }
      
      service.status = "paused"
      service.isPaused = true
      service.pausedTime = new Date()
    } else if (action === "resume") {
      if (service.status === "active") {
        return NextResponse.json({ error: "Service is already active" }, { status: 400 })
      }
      
      // Calculate paused duration and add to total
      if (service.pausedTime) {
        const now = new Date()
        const pausedDuration = Math.floor((now.getTime() - new Date(service.pausedTime).getTime()) / (1000 * 60))
        service.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration
      }
      
      service.status = "active"
      service.isPaused = false
      service.pausedTime = undefined
    } else {
      // Handle service editing (quantity, startTime, etc.)
      if (quantity !== undefined) {
        service.quantity = quantity
        // Update totalCost for unit-based services when quantity changes
        if (service.serviceType === "unit-based") {
          service.totalCost = Math.floor(quantity * (service.price || 0))
        }
      }
      if (startTime !== undefined) {
        service.startTime = new Date(startTime)
      }
      
      if (endTime !== undefined) {
        service.endTime = endTime ? new Date(endTime) : undefined
      }
      
      // Recalculate duration and cost for time-based services when times change
      if (service.serviceType === "time-based" && (startTime !== undefined || endTime !== undefined)) {
        const newStartTime = service.startTime ? new Date(service.startTime) : new Date()
        let calculationEndTime: Date
        
        if (service.endTime) {
          // Use the service's endTime (either existing or newly set)
          calculationEndTime = new Date(service.endTime)
        } else {
          // Use current time if no endTime is set
          calculationEndTime = new Date()
        }
        
        const totalMinutes = Math.max(0, Math.floor((calculationEndTime.getTime() - newStartTime.getTime()) / (1000 * 60)) - (service.totalPausedDuration || 0))
        service.duration = totalMinutes
        // Update totalCost using integer minutes
        service.totalCost = totalMinutes < 1 ? 0 : Math.floor(totalMinutes * (service.price || 0))
      }
      
      // If no valid update data provided, return error
      if (quantity === undefined && startTime === undefined && endTime === undefined) {
        return NextResponse.json({ error: "No valid update data provided" }, { status: 400 })
      }
    }

    // Recalculate total cost using stored database values only
    session.totalCost = session.services.reduce((total: number, s: any) => {
      // Use stored totalCost from database for all services
      return total + (s.totalCost || 0)
    }, 0)

    await session.save()

    const response = NextResponse.json(session)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}