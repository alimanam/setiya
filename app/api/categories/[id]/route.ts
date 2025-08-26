import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"
import { logDatabaseOperation } from "@/middleware/activity-logger"
import Service from "@/models/Service"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const category = await Category.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    
    const response = NextResponse.json(category)
    await logDatabaseOperation(request, response)
    return response
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    // Check if category is being used by any services
    const servicesUsingCategory = await Service.countDocuments({ category: params.id })
    
    if (servicesUsingCategory > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used by services" },
        { status: 400 }
      )
    }
    
    const category = await Category.findByIdAndDelete(params.id)
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    
    const response = NextResponse.json({ message: "Category deleted successfully" })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}