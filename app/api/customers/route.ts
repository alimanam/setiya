import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { withActivityLogging } from "@/middleware/activity-logger"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const search = searchParams.get('search') || ''
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    } : {}
    
    // If no pagination parameters are provided, return all customers
    if (!page && !limitParam) {
      const customers = await Customer.find(searchQuery)
        .sort({ firstName: 1, lastName: 1 }) // Sort alphabetically for better UX
      
      return NextResponse.json(customers)
    }
    
    // Handle pagination when parameters are provided
    const pageNum = parseInt(page || '1')
    const limit = parseInt(limitParam || '10')
    const skip = (pageNum - 1) * limit
    
    // Get total count for pagination
    const totalCustomers = await Customer.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalCustomers / limit)
    
    // Get customers with pagination and search
    const customers = await Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    return NextResponse.json({
      customers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCustomers,
        limit,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    const body = await request.json()

    const customer = new Customer(body)
    await customer.save()

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer", details: error.message }, { status: 500 })
  }
})
