import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import { withActivityLogging } from "@/middleware/activity-logger"

async function handlePOST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const body = await request.json()
    const { operatorUsername } = body

    // Find the session
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if session is already completed
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session is already completed" }, { status: 400 })
    }

    const now = new Date()

    // End all services and calculate their final costs
    const updatedServices = session.services.map((service: any) => {
      if (service.serviceType === "time-based" && !service.endTime) {
        const startTime = service.startTime ? new Date(service.startTime) : now
        const pausedDuration = service.totalPausedDuration || 0
        
        // Validate startTime
        if (!service.startTime || isNaN(startTime.getTime())) {
          console.warn('Invalid startTime found in service:', service)
          return {
            ...service,
            endTime: now,
            duration: 0,
            totalCost: 0
          }
        }
        
        // Use stored duration if available (for paused services), otherwise calculate
        let totalMinutes: number
        if (service.isPaused && service.duration !== undefined) {
          // Ensure stored duration is treated as integer minutes
          totalMinutes = Math.max(0, Math.floor(service.duration))
        } else {
          // Service is active, calculate current duration in minutes then floor to integer
          const rawMinutes = Math.max(0, (now.getTime() - startTime.getTime()) / (1000 * 60) - pausedDuration)
          totalMinutes = Math.floor(rawMinutes)
        }
        
        // Apply < 1 minute => cost = 0, otherwise multiply by unit price using integer math
        const minuteBasedCost = totalMinutes < 1 ? 0 : Math.floor(totalMinutes * (service.price || 0))
        
        return {
          ...service,
          endTime: now,
          duration: totalMinutes, // store integer minutes
          totalCost: isNaN(minuteBasedCost) ? 0 : minuteBasedCost
        }
      } else if (service.serviceType === "unit-based") {
        // For unit-based services, calculate cost based on quantity
        const unitBasedCost = Math.floor((service.quantity || 0) * (service.price || 0))
        
        return {
          ...service,
          totalCost: isNaN(unitBasedCost) ? 0 : unitBasedCost
        }
      }
      return service
    })

    // Calculate total session cost using stored totalCost from each service
    let totalCost = 0
    updatedServices.forEach((service: any) => {
      // Use the totalCost that was already calculated in the service update above
      const serviceCost = service.totalCost || 0
      if (!isNaN(serviceCost)) {
        totalCost += serviceCost
      }
    })

    // Update session
    session.status = "completed"
    session.endTime = now
    session.services = updatedServices
    session.totalCost = isNaN(totalCost) ? 0 : Math.max(0, totalCost)
    session.completedByOperator = operatorUsername
    
    await session.save()

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error ending session:", error)
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const response = await handlePOST(request, { params })
  
  // Log the operation manually since withActivityLogging doesn't support params
  const { logDatabaseOperation } = await import('@/middleware/activity-logger')
  await logDatabaseOperation(request, response)
  
  return response
}