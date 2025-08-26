import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const customer = await Customer.findByIdAndDelete(params.id)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const response = NextResponse.json({ message: "Customer deleted successfully" })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { firstName, lastName, phone } = body

    // Check if phone number already exists for a different customer
    if (phone) {
      const existingCustomer = await Customer.findOne({ 
        phone, 
        _id: { $ne: params.id } 
      })
      
      if (existingCustomer) {
        return NextResponse.json({ error: "Phone number already exists" }, { status: 400 })
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      params.id, 
      { firstName, lastName, phone }, 
      { new: true }
    )

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const response = NextResponse.json(customer)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}
