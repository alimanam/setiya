import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Operator from "@/models/Operator"
import { hashPassword } from "@/lib/password"
import { withActivityLogging } from "@/middleware/activity-logger"

export async function GET() {
  try {
    await dbConnect()
    
    // Get all operators but exclude password field
    const operators = await Operator.find({}, { password: 0 }).sort({ createdAt: -1 })
    
    return NextResponse.json(operators)
  } catch (error) {
    console.error("Error fetching operators:", error)
    return NextResponse.json(
      { error: "خطا در دریافت لیست اپراتورها" },
      { status: 500 }
    )
  }
}

export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    
    const { username, password, email, firstName, lastName, role } = await request.json()
    
    // Validate required fields
    if (!username || !password || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی است" },
        { status: 400 }
      )
    }
    
    // Check if username already exists
    const existingOperator = await Operator.findOne({ username })
    if (existingOperator) {
      return NextResponse.json(
        { error: "نام کاربری قبلاً استفاده شده است" },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existingEmail = await Operator.findOne({ email })
    if (existingEmail) {
      return NextResponse.json(
        { error: "ایمیل قبلاً استفاده شده است" },
        { status: 400 }
      )
    }
    
    // Hash the password before saving
    const hashedPassword = await hashPassword(password)
    
    // Create new operator
    const operator = new Operator({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      role: role || "operator"
    })
    
    await operator.save()
    
    // Return operator without password
    const { password: _, ...operatorData } = operator.toObject()
    
    return NextResponse.json(operatorData, { status: 201 })
  } catch (error) {
    console.error("Error creating operator:", error)
    return NextResponse.json(
      { error: "خطا در ایجاد اپراتور" },
      { status: 500 }
    )
  }
})