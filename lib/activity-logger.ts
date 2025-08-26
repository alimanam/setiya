import ActivityLog, { IActivityLog } from '@/models/ActivityLog'
import dbConnect from '@/lib/mongodb'
import { NextRequest } from 'next/server'

interface LogActivityParams {
  operatorId: string
  operatorUsername: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  request?: NextRequest
  status?: 'success' | 'failed'
}

export async function logActivity({
  operatorId,
  operatorUsername,
  action,
  resource,
  resourceId,
  details,
  request,
  status = 'success'
}: LogActivityParams): Promise<void> {
  try {
    await dbConnect()
    
    const logData: Partial<IActivityLog> = {
      operatorId,
      operatorUsername,
      action,
      resource,
      resourceId,
      details,
      status,
      timestamp: new Date()
    }

    // Extract IP address and user agent from request if provided
    if (request) {
      logData.ipAddress = getClientIP(request)
      logData.userAgent = request.headers.get('user-agent') || undefined
    }

    await ActivityLog.create(logData)
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper function to extract client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  return 'unknown'
}

// Helper function to get operator info from request headers or token
export function getOperatorFromRequest(request: NextRequest): { operatorId: string; operatorUsername: string } | null {
  try {
    // This should be extracted from JWT token in real implementation
    // For now, we'll assume it's passed in headers or we extract from token
    const operatorId = request.headers.get('x-operator-id')
    const operatorUsername = request.headers.get('x-operator-username')
    
    if (operatorId && operatorUsername) {
      return { operatorId, operatorUsername }
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract operator from request:', error)
    return null
  }
}

// Predefined log messages for common actions
export const LOG_ACTIONS = {
  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // CRUD actions
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  
  // Session actions
  START_SESSION: 'start_session',
  END_SESSION: 'end_session',
  CANCEL_SESSION: 'cancel_session',
  PAUSE_SESSION: 'pause_session',
  RESUME_SESSION: 'resume_session',
  
  // Service actions
  ADD_SERVICE: 'add_service',
  EDIT_SERVICE: 'edit_service',
  REMOVE_SERVICE: 'remove_service'
} as const

export const LOG_RESOURCES = {
  AUTH: 'auth',
  CUSTOMER: 'customer',
  SERVICE: 'service',
  SESSION: 'session',
  CATEGORY: 'category',
  OPERATOR: 'operator',
  SETTINGS: 'settings',
  BACKUP: 'backup'
} as const