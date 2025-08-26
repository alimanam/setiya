"use client"

import type React from "react"
import { useState, useCallback, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, EyeOff, LogIn, Mail, X } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/settings?key=gaming_house_logo')
        const data = await response.json()
        
        if (data.success && data.setting) {
          setLogoUrl(data.setting.value)
        }
      } catch (error) {
        console.error('Error loading logo:', error)
      }
    }
    
    loadLogo()
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies
          body: JSON.stringify({ username, password }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // JWT is in HTTP-only cookie. Optionally fetch user info for UI gating.
          try {
            const verifyRes = await fetch('/api/auth/verify', { method: 'GET', credentials: 'include' })
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              if (verifyData?.authenticated && verifyData?.user) {
                // Store minimal user profile for UI role checks only (not for authentication)
                localStorage.setItem('operator', JSON.stringify(verifyData.user))
              }
            }
          } catch (e) {
            // Non-fatal if verify fails here; AuthGuard will handle protection
          }
          router.push("/dashboard")
        } else {
          setError(data.error || "نام کاربری یا رمز عبور اشتباه است")
        }
      } catch (err) {
        setError("خطا در ورود به سیستم")
      }
    })
  }, [username, password, router])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")

    if (!forgotEmail.trim()) {
      setForgotError("ایمیل الزامی است")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      setForgotError("فرمت ایمیل صحیح نیست")
      return
    }

    setIsForgotLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotSuccess(data.message)
        setForgotEmail("")
      } else {
        setForgotError(data.error || "خطا در ارسال ایمیل بازیابی")
      }
    } catch (err) {
      setForgotError("خطا در ارتباط با سرور")
    } finally {
      setIsForgotLoading(false)
    }
  }, [forgotEmail])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {logoUrl && (
            <div className="mb-4">
              <img 
                src={logoUrl} 
                alt="Gaming House Logo" 
                className="max-h-16 mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-indigo-900">ستیا</CardTitle>
          <CardDescription className="text-gray-600">سیستم مدیریت خانه بازی</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                  className="text-right pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
              <LogIn className="h-4 w-4 mr-2" />
              {isPending ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-indigo-600 hover:text-indigo-800">
                  رمز عبور خود را فراموش کرده‌اید؟
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    بازیابی رمز عبور
                  </DialogTitle>
                  <DialogDescription>
                    ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">ایمیل</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ایمیل خود را وارد کنید"
                      className="text-right"
                      disabled={isForgotLoading}
                    />
                  </div>
                  
                  {forgotError && (
                    <Alert variant="destructive">
                      <AlertDescription>{forgotError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {forgotSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{forgotSuccess}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isForgotLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {isForgotLoading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotEmail("")
                        setForgotError("")
                        setForgotSuccess("")
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      بستن
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
