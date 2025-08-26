"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from 'next/dynamic'
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, DollarSign, Clock, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center">در حال بارگذاری...</div>
})

interface Session {
  id: string
  customerId: string
  customerName: string
  startTime: Date
  endTime?: Date
  status: "active" | "paused" | "completed"
  services: any[]
  totalCost: number
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  registrationDate: string
}

interface Service {
  id: string
  name: string
  type: "time-based" | "unit-based"
  category: string
  price: number
}

interface ReportData {
  totalRevenue: number
  totalSessions: number
  totalCustomers: number
  averageSessionDuration: number
  popularServices: Array<{ name: string; count: number; revenue: number }>
  dailyRevenue: Array<{ date: string; revenue: number; sessions: number }>
  serviceCategories: Array<{ name: string; value: number; color: string }>
  topCustomers: Array<{ customerId: string; customerName: string; revenue: number; sessions: number }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function ReportsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Build fast lookup maps for service -> category to avoid repeated finds and handle fallbacks
  const serviceIdToCategory = useMemo(() => {
    const map = new Map<string, string>()
    services.forEach((s) => {
      if (s?.id && s?.category) map.set(String(s.id), s.category)
    })
    return map
  }, [services])

  const serviceNameToCategory = useMemo(() => {
    const map = new Map<string, string>()
    services.forEach((s) => {
      if (s?.name && s?.category) map.set(s.name, s.category)
    })
    return map
  }, [services])

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      console.log('Starting fetchData...')
      try {
        // Fetch sessions
        console.log('Fetching sessions...')
        const sessionsResponse = await fetch('/api/sessions')
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          console.log('Raw sessions data from API:', sessionsData.length)
          console.log('First session raw:', sessionsData[0])
          const sessionsWithDates = sessionsData.map((session: any) => ({
            ...session,
            id: session._id,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
          }))
          console.log('Sessions after date conversion:', sessionsWithDates.length)
          console.log('First session converted:', sessionsWithDates[0])
          setSessions(sessionsWithDates)
        } else {
          console.error('Failed to fetch sessions:', sessionsResponse.status)
        }

        // Fetch customers
        console.log('Fetching customers...')
        const customersResponse = await fetch('/api/customers')
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          const customersArray = Array.isArray(customersData) ? customersData : customersData.customers || []
          const customersWithId = customersArray.map((customer: any) => ({
            ...customer,
            id: customer._id,
          }))
          setCustomers(customersWithId)
        } else {
          console.error('Failed to fetch customers:', customersResponse.status)
        }

        // Fetch services
        console.log('Fetching services...')
        const servicesResponse = await fetch('/api/services')
        console.log('Services response status:', servicesResponse.status)
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          console.log('Services data received:', servicesData.length)
          const servicesWithId = servicesData.map((service: any) => ({
            ...service,
            id: service._id,
          }))
          setServices(servicesWithId)
          console.log('Services set in state:', servicesWithId.length)
        } else {
          console.error('Failed to fetch services:', servicesResponse.status)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Calculate report data based on selected period with error handling
  const reportData = useMemo((): ReportData => {
    try {
      const now = new Date()
      let startDate: Date
      const endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      switch (reportPeriod) {
        case "daily":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
          break
        case "weekly":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0)
          break
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
          break
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      }

      // Filter sessions for the selected period
      console.log('Debug - All sessions:', sessions.length)
      console.log('Debug - Start date:', startDate)
      console.log('Debug - End date:', endDate)
      
      const filteredSessions = sessions.filter((session) => {
        if (session.status !== "completed" || !session.endTime) return false
        const sessionEndTime = new Date(session.endTime)
        const isInRange = sessionEndTime >= startDate && sessionEndTime <= endDate
        console.log(`Debug - Session ${session.customerName}: ${sessionEndTime} in range: ${isInRange}`)
        return isInRange
      })

      // Calculate basic metrics
      const totalRevenue = filteredSessions.reduce((sum, session) => sum + (session.totalCost || 0), 0)
      const totalSessions = filteredSessions.length
      const totalCustomers = new Set(filteredSessions.map((s) => s.customerId)).size

      // Calculate average session duration
      const totalDuration = filteredSessions.reduce((sum, session) => {
        if (session.endTime && session.startTime) {
          return sum + (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
        }
        return sum
      }, 0)
      const averageSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0

      // Calculate popular services with error handling
      const serviceUsage = new Map<string, { count: number; revenue: number }>()
      filteredSessions.forEach((session) => {
        if (session.services && Array.isArray(session.services)) {
          session.services.forEach((service: any) => {
            if (service?.serviceName) {
              const current = serviceUsage.get(service.serviceName) || { count: 0, revenue: 0 }
              serviceUsage.set(service.serviceName, {
                count: current.count + (service.quantity || 1),
                revenue: current.revenue + (service.totalCost || 0),
              })
            }
          })
        }
      })

      const popularServices = Array.from(serviceUsage.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate daily revenue for charts
      const dailyRevenue: Array<{ date: string; revenue: number; sessions: number }> = []
      const days = reportPeriod === "yearly" ? 365 : reportPeriod === "monthly" ? 30 : reportPeriod === "weekly" ? 7 : 1

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(endDate)
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)

        const daySessions = filteredSessions.filter(
          (session) => session.endTime && session.endTime >= dayStart && session.endTime <= dayEnd,
        )

        dailyRevenue.push({
          date:
            reportPeriod === "yearly"
              ? date.toLocaleDateString("fa-IR", { month: "short" })
              : date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
          revenue: daySessions.reduce((sum, session) => sum + (session.totalCost || 0), 0),
          sessions: daySessions.length,
        })
      }

      // Calculate service categories with improved error handling
      console.log('Debug - filteredSessions:', filteredSessions.length)
      console.log('Debug - services:', services.length)
      console.log('Debug - sample session:', filteredSessions[0])
      console.log('Debug - sample service:', services[0])
      
      const categoryRevenue = new Map<string, number>()
      filteredSessions.forEach((session) => {
        if (session.services && Array.isArray(session.services)) {
          console.log('Debug - session services:', session.services)
          session.services.forEach((service: any) => {
            // Resolve category by id first, then by name, otherwise bucket into "سایر"
            let categoryName: string | undefined = undefined

            if (service?.serviceId) {
              categoryName = serviceIdToCategory.get(String(service.serviceId))
            }
            if (!categoryName && service?.serviceName) {
              categoryName = serviceNameToCategory.get(String(service.serviceName))
            }

            const finalCategory = categoryName || "سایر"
            const prev = categoryRevenue.get(finalCategory) || 0
            categoryRevenue.set(finalCategory, prev + (service.totalCost || 0))
          })
        }
      })
      
      console.log('Debug - categoryRevenue:', Array.from(categoryRevenue.entries()))

      const serviceCategories = Array.from(categoryRevenue.entries())
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)

      // Calculate top customers by revenue contribution
      const customerRevenueMap = new Map<string, { name: string; revenue: number; sessions: number }>()
      filteredSessions.forEach((session) => {
        const id = session.customerId
        const name = session.customerName || (() => {
          const c = customers.find((cu) => cu.id === id)
          return c ? `${c.firstName} ${c.lastName}` : "نامشخصص"
        })()
        const current = customerRevenueMap.get(id) || { name, revenue: 0, sessions: 0 }
        customerRevenueMap.set(id, {
          name,
          revenue: current.revenue + (session.totalCost || 0),
          sessions: current.sessions + 1,
        })
      })

      const topCustomers = Array.from(customerRevenueMap.entries())
        .map(([customerId, data]) => ({ customerId, customerName: data.name, revenue: data.revenue, sessions: data.sessions }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      return {
        totalRevenue,
        totalSessions,
        totalCustomers,
        averageSessionDuration,
        popularServices,
        dailyRevenue,
        serviceCategories,
        topCustomers,
      }
    } catch (error) {
      console.error('Error calculating report data:', error)
      // Return empty report data in case of error
      return {
        totalRevenue: 0,
        totalSessions: 0,
        totalCustomers: 0,
        averageSessionDuration: 0,
        popularServices: [],
        dailyRevenue: [],
        serviceCategories: [],
        topCustomers: [],
      }
    }
  }, [sessions, services, customers, reportPeriod, serviceIdToCategory, serviceNameToCategory])

  const formatPrice = (price: number) => `${price.toLocaleString()} تومان`
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, "0")} ساعت` : `${mins} دقیقه`
  }

  const getPeriodTitle = () => {
    switch (reportPeriod) {
      case "daily":
        return "گزارش روزانه"
      case "weekly":
        return "گزارش هفتگی"
      case "monthly":
        return "گزارش ماهانه"
      case "yearly":
        return "گزارش سالیانه"
      default:
        return "گزارش"
    }
  }

  // ApexCharts options and series (memoized)
  const categories = useMemo(() => reportData.dailyRevenue.map((d) => d.date), [reportData.dailyRevenue])

  const revenueSeries = useMemo(() => [
    { name: 'درآمد', data: reportData.dailyRevenue.map((d) => d.revenue) }
  ], [reportData.dailyRevenue])

  const revenueOptions: any = useMemo(() => ({
    chart: { id: 'revenue', toolbar: { show: false } },
    stroke: { width: 2, curve: 'smooth' },
    dataLabels: { enabled: false },
    colors: ['#3b82f6'],
    xaxis: { categories },
    yaxis: [{ labels: { formatter: (val: number) => Math.round(val).toLocaleString() } }],
    tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} تومان` } }
  }), [categories])

  const sessionsSeries = useMemo(() => [
    { name: 'جلسات', data: reportData.dailyRevenue.map((d) => d.sessions) }
  ], [reportData.dailyRevenue])

  const sessionsOptions: any = useMemo(() => ({
    chart: { id: 'sessions', toolbar: { show: false } },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    colors: ['#10b981'],
    xaxis: { categories },
    yaxis: [{ labels: { formatter: (val: number) => Math.round(val).toLocaleString() } }],
    tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} جلسه` } }
  }), [categories])

  const pieSeries = useMemo(() => reportData.serviceCategories.map((c) => c.value), [reportData.serviceCategories])
  const pieOptions: any = useMemo(() => ({
    labels: reportData.serviceCategories.map((c) => c.name),
    colors: reportData.serviceCategories.map((c) => c.color),
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
    tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} تومان` } }
  }), [reportData.serviceCategories])

  const trendsSeries = useMemo(() => ([
    { name: 'درآمد', type: 'line', data: reportData.dailyRevenue.map((d) => d.revenue) },
    { name: 'جلسات', type: 'column', data: reportData.dailyRevenue.map((d) => d.sessions) }
  ]), [reportData.dailyRevenue])

  const trendsOptions: any = useMemo(() => ({
    chart: { id: 'trends', toolbar: { show: false }, stacked: false },
    stroke: { width: [2, 0], curve: 'smooth' },
    dataLabels: { enabled: false },
    colors: ['#3b82f6', '#10b981'],
    xaxis: { categories },
    yaxis: [
      { title: { text: 'درآمد' }, labels: { formatter: (val: number) => Math.round(val).toLocaleString() } },
      { opposite: true, title: { text: 'جلسات' }, labels: { formatter: (val: number) => Math.round(val).toLocaleString() } }
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number, { seriesIndex }: any) => seriesIndex === 0
          ? `${Math.round(value).toLocaleString()} تومان`
          : `${Math.round(value).toLocaleString()} جلسه`
      }
    },
    legend: { position: 'top' }
  }), [categories])

  // Peak hours state (moved before chart memos)
  const [peakPeriod, setPeakPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [peakData, setPeakData] = useState<Array<{ label: string; count: number }>>([])
  const [peakLoading, setPeakLoading] = useState<boolean>(false)

  // Peak hours fetcher
  useEffect(() => {
    const fetchPeak = async () => {
      try {
        setPeakLoading(true)
        const res = await fetch(`/api/reports?type=peak-hours&period=${peakPeriod}`)
        if (!res.ok) throw new Error(`Failed to fetch peak-hours: ${res.status}`)
        const data: any[] = await res.json()
        const normalized = data.map((item: any) => ({
          label: item.hour ?? item.day ?? item.month ?? item.year ?? "",
          count: Number(item.count) || 0,
        }))
        setPeakData(normalized)
      } catch (e) {
        console.error(e)
        setPeakData([])
      } finally {
        setPeakLoading(false)
      }
    }
    fetchPeak()
  }, [peakPeriod])

  // Peak hours charts (Apex) with export toolbar
  const peakCategories = useMemo(() => peakData.map((d) => d.label), [peakData])
  const peakSeries = useMemo(() => ([{ name: 'تعداد جلسات', data: peakData.map((d) => d.count) }]), [peakData])
  const peakOptions: any = useMemo(() => ({
    chart: {
      id: 'peak-hours',
      toolbar: {
        show: true,
        tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true },
        export: {
          csv: { filename: 'peak-hours' },
          png: { filename: 'peak-hours' },
          svg: { filename: 'peak-hours' }
        }
      }
    },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    colors: ['#6366f1'],
    xaxis: { categories: peakCategories },
    yaxis: [{ labels: { formatter: (val: number) => Math.round(val).toLocaleString() } }],
    tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} جلسه` } },
    grid: { strokeDashArray: 4 }
  }), [peakCategories])

  // removed duplicate peak chart declarations outside component to prevent redeclaration and syntax errors
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به داشبورد
                </Button>
                {/* Removed Detailed Reports button */}
                <h1 className="text-xl font-semibold text-gray-900">گزارشات</h1>
              </div>
              <div className="flex items-center gap-4">
                <Select value={reportPeriod} onValueChange={(value: any) => setReportPeriod(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">روزانه</SelectItem>
                    <SelectItem value="weekly">هفتگی</SelectItem>
                    <SelectItem value="monthly">ماهانه</SelectItem>
                    <SelectItem value="yearly">سالیانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{getPeriodTitle()}</h2>
            <p className="text-gray-600">آمار و گزارشات عملکرد خانه بازی ستیا</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatPrice(reportData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">در دوره انتخاب شده</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تعداد جلسات</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalSessions}</div>
                <p className="text-xs text-muted-foreground">جلسه تمام شده</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مشتریان فعال</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">مشتری منحصر به فرد</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">میانگین مدت جلسه</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(reportData.averageSessionDuration)}</div>
                <p className="text-xs text-muted-foreground">به طور متوسط</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نمای کلی</TabsTrigger>
              <TabsTrigger value="services">سرویس‌ها</TabsTrigger>
              <TabsTrigger value="trends">روند فروش</TabsTrigger>
              <TabsTrigger value="peak">ساعات پیک</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>روند درآمد</CardTitle>
                    <CardDescription>درآمد روزانه در دوره انتخاب شده</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <Chart options={revenueOptions} series={revenueSeries} type="line" height={300} />
                    </div>
                  </CardContent>
                </Card>

                {/* Sessions Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>تعداد جلسات</CardTitle>
                    <CardDescription>تعداد جلسات روزانه</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <Chart options={sessionsOptions} series={sessionsSeries} type="bar" height={300} />
                    </div>
                  </CardContent>
                </Card>
              </div>


              {/* Top 10 Customers by Revenue (RTL) */}
              <Card dir="rtl">
                <CardHeader>
                  <CardTitle>۱۰ مشتری برتر</CardTitle>
                  <CardDescription>مشتریانی که بیشترین درآمد را ایجاد کرده‌اند</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.topCustomers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">داده‌ای برای نمایش وجود ندارد</div>
                  ) : (
                    <div className="space-y-4">
                      {reportData.topCustomers.map((c, index) => (
                        <div key={c.customerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div className="text-right">
                              <h4 className="font-medium">{c.customerName}</h4>
                              <p className="text-sm text-gray-500">{c.sessions} جلسه</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-green-600">{formatPrice(c.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>توزیع درآمد بر اساس دسته‌بندی</CardTitle>
                  <CardDescription>سهم هر دسته از سرویس‌ها در کل درآمد</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.serviceCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">داده‌ای برای نمایش وجود ندارد</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-[300px]">
                        <Chart options={pieOptions} series={pieSeries} type="donut" height={300} />
                      </div>
                      <div className="space-y-3">
                        {reportData.serviceCategories.map((category, index) => (
                          <div key={category.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <span className="text-green-600 font-bold">{formatPrice(category.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تحلیل روند</CardTitle>
                  <CardDescription>بررسی روند درآمد و فعالیت در طول زمان</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Chart options={trendsOptions} series={trendsSeries} type="line" height={400} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Peak Hours Tab */}
            <TabsContent value="peak" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>ساعات پیک</CardTitle>
                    <CardDescription>شلوغ‌ترین بازه‌ها بر اساس جلسات تکمیل‌شده</CardDescription>
                  </div>
                  <div className="w-full md:w-40">
                    <Select value={peakPeriod} onValueChange={(v: any) => setPeakPeriod(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">روزانه</SelectItem>
                        <SelectItem value="weekly">هفتگی</SelectItem>
                        <SelectItem value="monthly">ماهانه</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {peakLoading ? (
                    <div className="h-[320px] flex items-center justify-center text-gray-500">در حال بارگذاری...</div>
                  ) : peakData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">داده‌ای برای نمایش وجود ندارد</div>
                  ) : (
                    <div className="h-[320px]">
                      <Chart options={peakOptions} series={peakSeries} type="bar" height={320} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
