import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"
import { withActivityLogging } from "@/middleware/activity-logger"

export async function GET() {
  try {
    await dbConnect()
    const categories = await Category.find({}).sort({ createdAt: -1 })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    const body = await request.json()

    const category = new Category(body)
    await category.save()

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
})