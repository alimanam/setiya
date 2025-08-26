"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Users, UserCheck, BarChart3, Settings, LogOut, FolderOpen, RefreshCw, Shield, FileText } from "lucide-react"
import { useEffect, useState, useCallback, useMemo, Suspense } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

export default function DashboardPage() {
  const router = useRouter()
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalServices, setTotalServices] = useState(0)
  const [activeSessions, setActiveSessions] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [logoUrl, setLogoUrl] = useState("")

  useEffect(() => {
    const operatorData = localStorage.getItem('operator')
    if (operatorData) {
      setCurrentUser(JSON.parse(operatorData))
    }
    
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

  const isAdmin = currentUser?.role === 'admin'

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Parallel API calls for better performance
      const [customersResponse, servicesResponse, sessionsResponse] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/services"),
        fetch("/api/sessions")
      ])

      // Process customers data
      if (customersResponse.ok) {
        const data = await customersResponse.json()
        const total = data?.pagination?.totalCustomers ?? (Array.isArray(data) ? data.length : (Array.isArray(data?.customers) ? data.customers.length : 0))
        setTotalCustomers(total)
      }

      // Process services data
      if (servicesResponse.ok) {
        const services = await servicesResponse.json()
        setTotalServices(services.filter((s: any) => s.isActive).length)
      }

      // Process sessions data
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json()
        const active = sessions.filter((s: any) => s.status === "active" || s.status === "paused").length
        setActiveSessions(active)

        // Calculate today's revenue
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        
        let todayRevenue = 0
        
        sessions.forEach((session: any) => {
          if (session.services && Array.isArray(session.services)) {
            session.services.forEach((service: any) => {
              // Check if service was completed today
              if (service.endTime) {
                const serviceEndTime = new Date(service.endTime)
                if (serviceEndTime >= todayStart && serviceEndTime < todayEnd) {
                  todayRevenue += service.totalCost || 0
                }
              }
              // Also check for completed sessions today (fallback)
              else if (session.status === "completed" && session.endTime) {
                const sessionEndTime = new Date(session.endTime)
                if (sessionEndTime >= todayStart && sessionEndTime < todayEnd) {
                  todayRevenue += service.totalCost || 0
                }
              }
            })
          }
        })
        
        setTodayRevenue(todayRevenue)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      // ignore logout errors; proceed to clear client state
    } finally {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("operator")
      router.push("/")
    }
  }, [router])

  const statsCards = useMemo(() => [
    {
      title: "کل مشتریان",
      value: totalCustomers,
      description: "مشتریان ثبت شده",
      icon: Users,
      href: "/dashboard/customers"
    },
    {
      title: "مشتریان حاضر",
      value: activeSessions,
      description: "در حال حاضر",
      icon: UserCheck,
      href: "/dashboard/sessions"
    },
    {
      title: "درآمد امروز",
      value: `${todayRevenue.toLocaleString()} تومان`,
      description: "درآمد روزانه",
      icon: BarChart3,
      href: "/dashboard/reports"
    },
    {
      title: "سرویس‌های فعال",
      value: totalServices,
      description: "سرویس فعال",
      icon: Settings,
      href: "/dashboard/services"
    }
  ], [totalCustomers, activeSessions, todayRevenue, totalServices])

  const quickActions = useMemo(() => {
    const baseActions = [
      {
        title: "مدیریت مشتریان",
        description: "ثبت مشتری جدید و مشاهده لیست مشتریان",
        icon: Users,
        href: "/dashboard/customers"
      },
      {
        title: "مشتریان حاضر",
        description: "مشاهده و مدیریت مشتریان حاضر در خانه بازی",
        icon: UserCheck,
        href: "/dashboard/sessions"
      },
      {
        title: "مدیریت سرویس‌ها",
        description: "تنظیم سرویس‌ها و قیمت‌گذاری",
        icon: Settings,
        href: "/dashboard/services"
      },
      {
        title: "مدیریت دسته‌بندی‌ها",
        description: "تعریف و مدیریت دسته‌بندی سرویس‌ها",
        icon: FolderOpen,
        href: "/dashboard/categories"
      },
      {
        title: "گزارشات",
        description: "گزارش‌های روزانه، هفتگی و ماهانه",
        icon: BarChart3,
        href: "/dashboard/reports"
      }
    ]

    // Add admin-only actions
    if (isAdmin) {
      baseActions.push(
        {
          title: "مدیریت اپراتورها",
          description: "مدیریت کاربران و دسترسی‌ها",
          icon: Shield,
          href: "/dashboard/operators"
        },
        {
          title: "تاریخچه فعالیت آپراتورها",
          description: "مشاهده فعالیت‌های اپراتورها",
          icon: FileText,
          href: "/dashboard/admin/activity-logs"
        },
        {
          title: "تنظیمات سیستم",
          description: "تنظیمات عمومی و پیکربندی سیستم",
          icon: Settings,
          href: "/dashboard/settings"
        }
      )
    }

    return baseActions
  }, [isAdmin])

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Gaming House Logo" 
                    className="max-h-10"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {logoUrl ? "داشبورد" : "داشبورد ستیا"}
                  </h1>
                  {lastUpdated && (
                    <p className="text-xs text-gray-500 mt-1">
                      آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
                    </p>
                  )}
                </div>
              </div>
              {/* Welcome Message */}
              {currentUser && (
                <div className="flex items-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
                    <p className="text-sm text-blue-800 font-medium">
                      خوش آمدید {currentUser.name || currentUser.username}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={fetchDashboardData} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  بروزرسانی
                </Button>
                <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <Suspense fallback={<div>در حال بارگذاری آمار...</div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => router.push(stat.href)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </Suspense>

          {/* Quick Actions */}
          <Suspense fallback={<div>در حال بارگذاری عملیات سریع...</div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" 
                    onClick={() => router.push(action.href)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {action.title}
                      </CardTitle>
                      <CardDescription>
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </Suspense>
        </main>
      </div>
    </AuthGuard>
  )
}
