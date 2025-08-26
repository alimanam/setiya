import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Settings from '@/models/Settings'
import { withActivityLogging, logDatabaseOperation } from '@/middleware/activity-logger'

// GET - Retrieve all settings or a specific setting
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (key) {
      // Get specific setting
      const setting = await Settings.findOne({ key })
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, setting })
    } else {
      // Get all settings
      const settings = await Settings.find({}).sort({ key: 1 })
      return NextResponse.json({ success: true, settings })
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Create or update a setting
export const POST = withActivityLogging(async (request: NextRequest) => {
  try {
    await dbConnect()
    
    const { key, value, description } = await request.json()
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }
    
    // Update existing setting or create new one
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true, runValidators: true }
    )
    
    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
})

// DELETE - Delete a setting
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }
    
    const deletedSetting = await Settings.findOneAndDelete({ key })
    
    if (!deletedSetting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }
    
    const response = NextResponse.json({ success: true, message: 'Setting deleted successfully' })
    await logDatabaseOperation(request, response)
    return response
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
  }
}