import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Service from "@/models/Service"
import { withActivityLogging } from "@/middleware/activity-logger"

async function handleGET() {
  try {
    await dbConnect()
    const services = await Service.find({ isActive: true }).sort({ createdAt: -1 })
    console.log('API Services - Found services:', services.length)
    console.log('API Services - Sample service:', services[0])
    return NextResponse.json(services)
  } catch (error) {
    console.error('API Services - Error:', error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

async function handlePOST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const service = new Service(body)
    await service.save()

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}

export const GET = () => handleGET()
export const POST = withActivityLogging(handlePOST)
