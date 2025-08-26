import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Service from "@/models/Service"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const service = await Service.findByIdAndDelete(params.id)

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const response = NextResponse.json({ message: "Service deleted successfully" })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()

    const service = await Service.findByIdAndUpdate(params.id, body, { new: true })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const response = NextResponse.json(service)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}
