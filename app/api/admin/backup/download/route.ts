import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/jwt-edge'
import { backupProgress } from '../shared'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const tokenResult = await verifyTokenFromRequest(request)
    if (!tokenResult || tokenResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('backupId')

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      )
    }

    // Check if backup ZIP file exists directly in filesystem
    const backupDir = path.join(process.cwd(), 'temp', 'backups')
    const zipFilePath = path.join(backupDir, `${backupId}.zip`)
    
    if (!fs.existsSync(zipFilePath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Read the backup ZIP file
    const fileBuffer = fs.readFileSync(zipFilePath)
    const fileName = `backup_${new Date().toISOString().split('T')[0]}_${backupId.split('_')[1]}.zip`

    // Return ZIP file as download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}