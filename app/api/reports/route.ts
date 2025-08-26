import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import Customer from "@/models/Customer"
import { toJalaliYear } from "@/lib/utils"

const weekDaysFa = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]
const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]

export async function GET(request: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // peak-hours | customer-loyalty
  const period = searchParams.get("period") // daily | weekly | monthly | yearly

  if (type === "peak-hours") {
    // ساعات کاری بر اساس بازه زمانی
    if (period === "daily") {
      // گروه‌بندی بر اساس ساعت شروع و حذف ساعات شبانه (مثلاً 0 تا 7 و 23)
      const result = await Session.aggregate([
        { $match: { status: "completed" } },
        { $group: {
          _id: { $hour: "$startTime" },
          count: { $sum: 1 }
        }},
        { $sort: { "_id": 1 } }
      ])
      // فقط ساعات 8 تا 22
      const filtered = result.filter(item => item._id >= 8 && item._id <= 22)
      return NextResponse.json(filtered.map(item => ({ hour: `${item._id}:00`, count: item.count })))
    }
    if (period === "weekly") {
      // گروه‌بندی بر اساس روز هفته و تبدیل به نام فارسی
      const result = await Session.aggregate([
        { $match: { status: "completed" } },
        { $group: {
          _id: { $dayOfWeek: "$startTime" }, // 1=یکشنبه ... 7=شنبه
          count: { $sum: 1 }
        }},
        { $sort: { "_id": 1 } }
      ])
      return NextResponse.json(result.map(item => ({ day: weekDaysFa[(item._id - 1) % 7], count: item.count })))
    }
    if (period === "monthly") {
      // گروه‌بندی بر اساس ماه و تبدیل به نام فارسی
      const result = await Session.aggregate([
        { $match: { status: "completed" } },
        { $group: {
          _id: { $month: "$startTime" }, // 1=فروردین ... 12=اسفند
          count: { $sum: 1 }
        }},
        { $sort: { "_id": 1 } }
      ])
      return NextResponse.json(result.map(item => ({ month: persianMonths[(item._id - 1) % 12], count: item.count })))
    }
    if (period === "yearly") {
      // گروه‌بندی بر اساس سال و تبدیل به سال شمسی
      const result = await Session.aggregate([
        { $match: { status: "completed" } },
        { $group: {
          _id: { $year: "$startTime" },
          count: { $sum: 1 }
        }},
        { $sort: { "_id": 1 } }
      ])
      return NextResponse.json(result.map(item => ({ year: toJalaliYear(item._id), count: item.count })))
    }
  }
  if (type === "customer-loyalty") {
    // وفاداری مشتریان بر اساس تعداد حضور
    const result = await Session.aggregate([
      { $match: { status: "completed" } },
      { $group: {
        _id: "$customerId",
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    // دریافت اطلاعات مشتریان
    const customers = await Customer.find({ _id: { $in: result.map(r => r._id) } })
    const loyalty = result.map(r => {
      const customer = customers.find(c => c._id.toString() === r._id.toString())
      return {
        customerId: r._id,
        name: customer ? `${customer.firstName} ${customer.lastName}` : "-",
        count: r.count
      }
    })
    return NextResponse.json(loyalty)
  }
  return NextResponse.json({ error: "Invalid report type or period" }, { status: 400 })
}
// تبدیل سال میلادی به شمسی
// lib/utils.js یا ts باید تابع toJalaliYear را داشته باشد