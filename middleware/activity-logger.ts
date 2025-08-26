import { NextRequest, NextResponse } from 'next/server'
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from '@/lib/activity-logger'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  username: string
  isAdmin: boolean
}

// Helper function to extract operator info from JWT token
function getOperatorFromToken(request: NextRequest): { operatorId: string; operatorUsername: string } | null {
  try {
    // Get JWT token from cookie instead of Authorization header
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    return {
      operatorId: decoded.userId,
      operatorUsername: decoded.username
    }
  } catch (error) {
    return null
  }
}

// Helper function to determine resource type from URL
function getResourceFromUrl(pathname: string): string {
  if (pathname.includes('/customers')) return LOG_RESOURCES.CUSTOMER
  if (pathname.includes('/services')) return LOG_RESOURCES.SERVICE
  if (pathname.includes('/sessions')) return LOG_RESOURCES.SESSION
  if (pathname.includes('/categories')) return LOG_RESOURCES.CATEGORY
  if (pathname.includes('/operators')) return LOG_RESOURCES.OPERATOR
  if (pathname.includes('/settings')) return LOG_RESOURCES.SETTINGS
  return 'unknown'
}

// Helper function to determine action from HTTP method and URL
function getActionFromRequest(method: string, pathname: string): string {
  const isEndSession = pathname.includes('/end')
  const isStartSession = pathname.includes('/start')
  const isPauseSession = pathname.includes('/pause')
  const isResumeSession = pathname.includes('/resume')
  const isAddService = pathname.includes('/add-service')
  const isEditService = pathname.includes('/edit-service')
  const isRemoveService = pathname.includes('/remove-service')

  if (isEndSession) return LOG_ACTIONS.END_SESSION
  if (isStartSession) return LOG_ACTIONS.START_SESSION
  if (isPauseSession) return LOG_ACTIONS.PAUSE_SESSION
  if (isResumeSession) return LOG_ACTIONS.RESUME_SESSION
  if (isAddService) return LOG_ACTIONS.ADD_SERVICE
  if (isEditService) return LOG_ACTIONS.EDIT_SERVICE
  if (isRemoveService) return LOG_ACTIONS.REMOVE_SERVICE

  switch (method) {
    case 'POST':
      return LOG_ACTIONS.CREATE
    case 'PUT':
    case 'PATCH':
      return LOG_ACTIONS.UPDATE
    case 'DELETE':
      return LOG_ACTIONS.DELETE
    case 'GET':
      return LOG_ACTIONS.VIEW
    default:
      return 'unknown'
  }
}

// Helper function to extract resource ID from URL
function getResourceIdFromUrl(pathname: string): string | undefined {
  // Extract ID from patterns like /api/customers/[id], /api/sessions/[id]/end, etc.
  const segments = pathname.split('/')
  
  // Look for MongoDB ObjectId pattern (24 hex characters)
  for (const segment of segments) {
    if (/^[0-9a-fA-F]{24}$/.test(segment)) {
      return segment
    }
  }
  
  return undefined
}

// Middleware function to log database operations
export async function logDatabaseOperation(
  request: NextRequest,
  response: NextResponse,
  additionalDetails?: any
) {
  try {
    // Only log API routes that modify data
    const pathname = request.nextUrl.pathname
    if (!pathname.startsWith('/api/') || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout')) {
      return
    }

    // Skip logging for activity logs endpoint to avoid infinite loops
    if (pathname.includes('/activity-logs')) {
      return
    }

    const operator = getOperatorFromToken(request)
    if (!operator) {
      return // No valid operator found
    }

    const method = request.method
    const resource = getResourceFromUrl(pathname)
    const action = getActionFromRequest(method, pathname)
    const resourceId = getResourceIdFromUrl(pathname)
    const status = response.status >= 200 && response.status < 300 ? 'success' : 'failed'

    // Prepare details object
    const details: any = {
      method,
      url: pathname,
      statusCode: response.status,
      ...additionalDetails
    }

    // Add request body for POST/PUT/PATCH requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.clone().json()
        // Remove sensitive fields
        const sanitizedBody = { ...body }
        delete sanitizedBody.password
        delete sanitizedBody.token
        details.requestBody = sanitizedBody
      } catch (error) {
        // Body might not be JSON, skip it
      }
    }

    await logActivity({
      operatorId: operator.operatorId,
      operatorUsername: operator.operatorUsername,
      action,
      resource,
      resourceId,
      details,
      request,
      status
    })
  } catch (error) {
    console.error('Error in activity logging middleware:', error)
    // Don't throw error to avoid breaking the main request
  }
}

// Wrapper function for API routes
export function withActivityLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request)
    
    // Log the operation after the handler completes
    await logDatabaseOperation(request, response)
    
    return response
  }
}