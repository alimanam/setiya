import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Operator from "@/models/Operator"
import { hashPassword } from "@/lib/password"
import { logDatabaseOperation } from "@/middleware/activity-logger"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const { username, password, email, firstName, lastName, role } = await request.json()
    const { id } = params
    
    // Validate required fields (password is optional for updates)
    if (!username || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی است" },
        { status: 400 }
      )
    }
    
    // Check if username already exists (excluding current operator)
    const existingOperator = await Operator.findOne({ username, _id: { $ne: id } })
    if (existingOperator) {
      return NextResponse.json(
        { error: "نام کاربری قبلاً استفاده شده است" },
        { status: 400 }
      )
    }
    
    // Check if email already exists (excluding current operator)
    const existingEmail = await Operator.findOne({ email, _id: { $ne: id } })
    if (existingEmail) {
      return NextResponse.json(
        { error: "ایمیل قبلاً استفاده شده است" },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      username,
      email,
      firstName,
      lastName,
      role: role || "operator"
    }
    
    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password)
    }
    
    // Update operator
    const updatedOperator = await Operator.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: "-password" }
    )
    
    if (!updatedOperator) {
      return NextResponse.json(
        { error: "اپراتور یافت نشد" },
        { status: 404 }
      )
    }
    
    const response = NextResponse.json(updatedOperator)
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error updating operator:", error)
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اپراتور" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const { id } = params
    
    // Find the operator to check if it's an admin
    const operator = await Operator.findById(id)
    if (!operator) {
      return NextResponse.json(
        { error: "اپراتور یافت نشد" },
        { status: 404 }
      )
    }
    
    // Prevent deletion of admin users
    if (operator.role === "admin") {
      return NextResponse.json(
        { error: "امکان حذف کاربر مدیر وجود ندارد" },
        { status: 400 }
      )
    }
    
    // Delete the operator
    await Operator.findByIdAndDelete(id)
    
    const response = NextResponse.json({ message: "اپراتور با موفقیت حذف شد" })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error("Error deleting operator:", error)
    return NextResponse.json(
      { error: "خطا در حذف اپراتور" },
      { status: 500 }
    )
  }
}