import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/jwt-edge'
import { backupProgress } from '../shared'

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

    // Set up Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        let retryCount = 0
        const maxRetries = 10 // Wait up to 5 seconds (10 * 500ms)
        
        const sendProgress = () => {
          const progress = backupProgress.get(backupId)
          
          if (!progress) {
            if (retryCount < maxRetries) {
              retryCount++
              // Wait a bit and try again - backup might still be initializing
              setTimeout(sendProgress, 500)
              return
            }
            
            const data = encoder.encode(`data: ${JSON.stringify({
              error: 'Backup not found',
              status: 'error'
            })}\n\n`)
            controller.enqueue(data)
            controller.close()
            return
          }
          
          // Reset retry count once we find the backup
          retryCount = 0

          const data = encoder.encode(`data: ${JSON.stringify({
            status: progress.status,
            progress: progress.progress,
            currentCollection: progress.currentCollection,
            processedRecords: progress.processedRecords,
            totalRecords: progress.totalRecords,
            collections: progress.collections,
            startTime: progress.startTime,
            endTime: progress.endTime,
            error: progress.error,
            downloadUrl: progress.downloadUrl,
            estimatedTimeRemaining: calculateEstimatedTime(progress),
            processingSpeed: calculateProcessingSpeed(progress)
          })}\n\n`)
          
          controller.enqueue(data)

          // Close connection if backup is completed or failed
          if (progress.status === 'completed' || progress.status === 'error') {
            controller.close()
            return
          }

          // Continue sending updates every 1 second
          setTimeout(sendProgress, 1000)
        }

        // Send initial progress
        sendProgress()
      },
      
      cancel() {
        // Cleanup when client disconnects
        console.log('SSE connection closed')
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('Error in backup progress SSE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate estimated time remaining
function calculateEstimatedTime(progress: any): string {
  if (progress.status !== 'in_progress' || progress.progress === 0) {
    return 'محاسبه نشده'
  }

  const elapsed = Date.now() - new Date(progress.startTime).getTime()
  const rate = progress.progress / elapsed
  const remaining = (100 - progress.progress) / rate
  
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes} دقیقه و ${seconds} ثانیه`
  }
  return `${seconds} ثانیه`
}

// Helper function to calculate processing speed
function calculateProcessingSpeed(progress: any): string {
  if (progress.status !== 'in_progress' || progress.processedRecords === 0) {
    return '0 رکورد/ثانیه'
  }

  const elapsed = (Date.now() - new Date(progress.startTime).getTime()) / 1000
  const speed = Math.round(progress.processedRecords / elapsed)
  
  return `${speed} رکورد/ثانیه`
}

// Export the backupProgress map so it can be imported by other routes