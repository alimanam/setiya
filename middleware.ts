import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt-edge'

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard']

// Define public routes that don't require authentication
const publicRoutes = ['/', '/api/auth/login', '/api/auth/logout', '/api/auth/forgot-password', '/api/auth/reset-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  )
  
  // Enforce auth for API routes (except auth endpoints)
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next()
    }

    try {
      const token = request.cookies.get('auth-token')?.value
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const payload = await verifyToken(token)
      if (!payload) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        response.cookies.delete('auth-token')
        return response
      }

      // Token is valid, pass user info to downstream handlers if needed
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-role', payload.role || 'user')

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('JWT verification failed (API):', error)
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.cookies.delete('auth-token')
      return response
    }
  }
  
  // If it's a protected route (pages), check for JWT authentication
  if (isProtectedRoute) {
    try {
      // Get the JWT token from HTTP-only cookie
      const token = request.cookies.get('auth-token')?.value
      
      if (!token) {
        // No token found, redirect to login
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
      }
      
      // Verify the JWT token
      const payload = await verifyToken(token)
      
      if (!payload) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/', request.url)
        const response = NextResponse.redirect(loginUrl)
        // Clear the invalid token
        response.cookies.delete('auth-token')
        return response
      }
      
      // Token is valid, allow the request to proceed
      // Add user info to headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-role', payload.role || 'user')
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
    } catch (error) {
      // Token verification failed, redirect to login
      console.error('JWT verification failed:', error)
      const loginUrl = new URL('/', request.url)
      const response = NextResponse.redirect(loginUrl)
      // Clear the invalid token
      response.cookies.delete('auth-token')
      return response
    }
  }
  
  // Allow all other requests to proceed
  return NextResponse.next()
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}