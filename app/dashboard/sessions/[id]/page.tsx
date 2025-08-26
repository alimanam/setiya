"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Clock, DollarSign, QrCode, User, Phone } from "lucide-react"
import { Session, formatPrice } from "@/components/sessions"

export default function SessionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = useMemo(() => (params?.id as string) || "", [params])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const qrRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/sessions/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to load session ${id}`)
        }
        const data = await res.json()
        setSession(data)
      } catch (e: any) {
        setError(e?.message || "خطا در دریافت اطلاعات جلسه")
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  // Render QR code for the session id
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout | null = null

    const renderQr = async () => {
      try {
        if (!session || !qrRef.current) return
        const QrCreatorModule = await import("qr-creator")
        const QrCreator = (QrCreatorModule as any).default || QrCreatorModule
        const qrText = (session as any).completedSessionId?.toString?.() || (session as any)._id || (session as any).id || id

        // small delay to ensure container is mounted
        timeoutId = setTimeout(() => {
          if (cancelled || !qrRef.current) return
          try {
            qrRef.current.innerHTML = ""
            QrCreator.render(
              {
                text: String(qrText),
                radius: 0.3,
                ecLevel: "M",
                fill: "#111827",
                background: "#FFFFFF",
                size: 160,
              },
              qrRef.current
            )
          } catch (err) {
            console.error("QR render error", err)
            if (qrRef.current) qrRef.current.innerHTML = '<span class="text-red-600">خطا در رندر QR</span>'
          }
        }, 200)
      } catch (err) {
        console.error("QR load error", err)
        if (qrRef.current) qrRef.current.innerHTML = '<span class="text-red-600">ماژول QR بارگذاری نشد</span>'
      }
    }

    renderQr()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (qrRef.current) qrRef.current.innerHTML = ""
    }
  }, [session, id])

  const infoItems = useMemo(() => {
    if (!session) return []
    const start = session.startTime ? new Date(session.startTime as any).toLocaleString("fa-IR") : "-"
    const end = session.endTime ? new Date(session.endTime as any).toLocaleString("fa-IR") : "-"
    const total = formatPrice(session.totalCost || 0)

    return [
      { label: "مشتری", value: session.customerName || "مهمان", icon: <User className="h-4 w-4" /> },
      { label: "شماره تماس", value: session.customerPhone || "—", icon: <Phone className="h-4 w-4" /> },
      { label: "شروع", value: start, icon: <Clock className="h-4 w-4" /> },
      { label: "پایان", value: end, icon: <Clock className="h-4 w-4" /> },
      { label: "مبلغ کل", value: total, icon: <DollarSign className="h-4 w-4" /> },
    ]
  }, [session])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard/sessions")} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به جلسات
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">جزئیات جلسه</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : session ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary */}
              <Card className="lg:col-span-2 border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <CardTitle className="text-sm font-bold text-white">اطلاعات جلسه</CardTitle>
                      <CardDescription className="text-xs text-white font-bold">شناسه: {(session as any)._id || (session as any).id || id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {infoItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white/70">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          {item.icon}
                          {item.label}
                        </div>
                        <div className="text-slate-900 font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* QR */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">بارکد جلسه</CardTitle>
                      <CardDescription className="text-emerald-100">برای اشتراک‌گذاری با مشتری</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-center">
                  <div ref={qrRef} className="flex items-center justify-center" />
                </CardContent>
              </Card>

              {/* Services */}
              <Card className="lg:col-span-3 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base">سرویس‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-right">نام سرویس</TableHead>
                          <TableHead className="text-center">نوع</TableHead>
                          <TableHead className="text-center">تعداد/مدت</TableHead>
                          <TableHead className="text-center">قیمت واحد</TableHead>
                          <TableHead className="text-center">مبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(session.services || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-slate-500">سرویسی ثبت نشده است</TableCell>
                          </TableRow>
                        ) : (
                          (session.services || []).map((s: any, i: number) => {
                            const typeLabel = s.serviceType === "time-based" ? "زمانی" : "واحدی"
                            const qtyOrDur = s.serviceType === "time-based" ? `${Math.floor(s.duration || 0)} دقیقه` : `${s.quantity} عدد`
                            return (
                              <TableRow key={`${s.serviceId || s._id || i}`}>
                                <TableCell className="text-right">{s.serviceName || "-"}</TableCell>
                                <TableCell className="text-center">{typeLabel}</TableCell>
                                <TableCell className="text-center">{qtyOrDur}</TableCell>
                                <TableCell className="text-center">{formatPrice(s.price || 0)}</TableCell>
                                <TableCell className="text-center font-bold text-emerald-600">{formatPrice(s.totalCost || 0)}</TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert className="mb-6">
              <AlertDescription>جلسه‌ای یافت نشد</AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}