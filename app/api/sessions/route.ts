import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Session"
import { withActivityLogging } from "@/middleware/activity-logger"

async function handleGET() {
  try {
    await dbConnect()
    const sessions = await Session.find({}).sort({ createdAt: -1 })
    console.log('API Sessions - Found sessions:', sessions.length)
    console.log('API Sessions - Sample session:', sessions[0])
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('API Sessions - Error:', error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

async function handlePOST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const session = new Session(body)
    await session.save()

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export const GET = () => handleGET()
export const POST = withActivityLogging(handlePOST)
