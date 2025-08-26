"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, DollarSign, User, Calendar, Activity, Printer, Send, X } from "lucide-react"
import { Session } from "./types"
import { useState, useEffect } from "react"
import html2canvas from "html2canvas"

interface SessionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  formatPrice: (price: number) => string
}

interface GameHouseSettings {
  name?: string
  address?: string
  instagram?: string
  phone?: string
}

export function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
  formatPrice
}: SessionDetailsDialogProps) {
  const [ghSettings, setGhSettings] = useState<GameHouseSettings>({})
  const [telegramSettings, setTelegramSettings] = useState({ botToken: '', chatId: '' })
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false)


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          const settingsArr = data.settings || []
          const findVal = (key: string) => settingsArr.find((s: any) => s.key === key)?.value
          setGhSettings({
            name: findVal('gaming_house_name') || '',
            address: findVal('gaming_house_address') || '',
            instagram: findVal('gaming_house_instagram') || '',
            phone: findVal('gaming_house_phone') || '',
          })
          setTelegramSettings({
            botToken: findVal('telegram_bot_token') || '',
            chatId: findVal('telegram_chat_id') || ''
          })
        }
      } catch (e) {
        console.error('Failed to load settings', e)
      }
    }
    if (open) loadSettings()
  }, [open])



  if (!session) return null

  const handlePrint = () => {
    try {
      const startDate = (session.startTime instanceof Date ? session.startTime : new Date(session.startTime as any)).toLocaleString("fa-IR")
      const endDate = session.endTime ? ((session.endTime instanceof Date ? session.endTime : new Date(session.endTime as any)).toLocaleString("fa-IR")) : "-"
      const trackingNumber = (session._id || session.id || '').toString()

      // QR codes removed from invoice

      const servicesRows = (session.services || [])
        .map((service: any, index: number) => {
          const typeLabel = service.serviceType === "time-based" ? "زمانی" : "واحدی"
          const qtyOrDuration = service.serviceType === "time-based"
            ? `${Math.floor(service.duration || 0)} دقیقه`
            : `${service.quantity} عدد`
          const unitPrice = formatPrice(service.price || 0)
          const total = formatPrice(service.totalCost || 0)
          return `
             <tr>
               <td style="padding: 8px; border: 1px solid rgb(229, 231, 235);">${service.serviceName || "-"}</td>
               <td style="padding: 8px; border: 1px solid rgb(229, 231, 235);">${typeLabel}</td>
               <td style="padding: 8px; border: 1px solid rgb(229, 231, 235);">${qtyOrDuration}</td>
               <td style="padding: 8px; border: 1px solid rgb(229, 231, 235);">${unitPrice}</td>
               <td style="padding: 8px; border: 1px solid rgb(229, 231, 235); font-weight: 700; color: rgb(5, 150, 105);">${total}</td>
             </tr>
           `
        })
        .join("")

      const totalCost = formatPrice(session.totalCost || 0)

      const brandName = ghSettings.name && ghSettings.name.trim() !== '' ? ghSettings.name : '—'

      const html = `
        <!doctype html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>فاکتور جلسه - ${session.customerName || ""}</title>
            <style>
              body { font-family: Tahoma, "IRANSans", Arial, sans-serif; direction: rtl; unicode-bidi: embed; color: #0f172a; }
              .container { max-width: 900px; margin: 0 auto; padding: 24px; }
              .card { border: 2px solid #e5e7eb; border-radius: 16px; padding: 24px; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
              .title { font-size: 22px; font-weight: 900; color:#0f172a; }
              .brand { font-size: 14px; color:#334155; font-weight:700; }
              .subtitle { color: #475569; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }
              .box { border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
              .box-blue { background-color: #eff6ff; border-color: #bfdbfe; }
              .box-green { background-color: #ecfdf5; border-color: #a7f3d0; }
              .label { font-size: 12px; font-weight: 800; margin-bottom: 8px; display: block; color: #0369a1; }
              .label-green { color: #047857; }
              table { width: 100%; border-collapse: collapse; }
              thead th { text-align: right; background: linear-gradient(90deg, #f8fafc, #eff6ff); padding: 10px; border: 1px solid #e5e7eb; font-weight: 800; }
              tbody td { padding: 8px; border: 1px solid #e5e7eb; }
              .total { text-align: left; font-weight: 800; color: #059669; }
              .footer { margin-top: 22px; }
              .contact { font-size: 13px; color:#334155; line-height: 1.9; }
              @media print {
                .no-print { display: none; }
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div>
                    <div class="title">فاکتور جلسه</div>
                    <div class="brand">${brandName}</div>
                  </div>
                  <div class="subtitle">تاریخ: ${new Date().toLocaleDateString("fa-IR")}</div>
                </div>
                
                <div class="grid">
                  <div class="box box-blue">
                    <span class="label">مشتری</span>
                    <div>${session.customerName || "مهمان"}</div>
                  </div>
                  <div class="box box-green">
                    <span class="label label-green">مبلغ کل</span>
                    <div>${totalCost}</div>
                  </div>
                </div>
                
                <div class="grid">
                  <div class="box">
                    <span class="label">شروع جلسه</span>
                    <div>${startDate}</div>
                  </div>
                  <div class="box">
                    <span class="label">پایان جلسه</span>
                    <div>${endDate}</div>
                  </div>
                </div>
                
                <div class="box" style="margin-top: 16px;">
                  <span class="label">کد پیگیری</span>
                  <div>${trackingNumber}</div>
                </div>
                
                <div style="margin-top: 24px;">
                  <table>
                    <thead>
                      <tr>
                        <th>خدمات</th>
                        <th>نوع</th>
                        <th>مقدار/مدت</th>
                        <th>قیمت واحد</th>
                        <th>قیمت کل</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${servicesRows}
                      <tr>
                        <td colspan="4" style="text-align: left; font-weight: 700;">جمع کل:</td>
                        <td class="total">${totalCost}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div class="footer">
                  <div class="contact">
                    ${ghSettings.address ? `<div>آدرس: ${ghSettings.address}</div>` : ''}
                    ${ghSettings.phone ? `<div>تلفن: ${ghSettings.phone}</div>` : ''}
                    ${ghSettings.instagram ? `<div>اینستاگرام: ${ghSettings.instagram}</div>` : ''}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('لطفاً پاپ‌آپ‌ها را برای این سایت فعال کنید')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    } catch (err) {
      console.error('Failed to print invoice:', err)
      alert('خطا در چاپ فاکتور')
    }
  }

  const handleSendToTelegram = async () => {
    if (!session || !telegramSettings.botToken || !telegramSettings.chatId) {
      alert('تنظیمات تلگرام کامل نیست')
      return
    }

    try {
      setIsSendingToTelegram(true)

      const startDate = (session.startTime instanceof Date ? session.startTime : new Date(session.startTime as any)).toLocaleString("fa-IR")
      const endDate = session.endTime ? ((session.endTime instanceof Date ? session.endTime : new Date(session.endTime as any)).toLocaleString("fa-IR")) : "-"
      
      // Create a div to render the invoice for image capture
      const invoiceDiv = document.createElement('div')
      invoiceDiv.style.width = '600px'
      invoiceDiv.style.padding = '20px'
      invoiceDiv.style.backgroundColor = 'white'
      invoiceDiv.style.fontFamily = 'Tahoma, "IRANSans", Arial, sans-serif'
      invoiceDiv.style.direction = 'rtl'
      invoiceDiv.style.position = 'fixed'
      invoiceDiv.style.left = '-9999px'
      invoiceDiv.style.top = '-9999px'
      
      const servicesHtml = (session.services || [])
        .map((service: any) => {
          const typeLabel = service.serviceType === "time-based" ? "زمانی" : "واحدی"
          const qtyOrDuration = service.serviceType === "time-based"
            ? `${Math.floor(service.duration || 0)} دقیقه`
            : `${service.quantity} عدد`
          const unitPrice = formatPrice(service.price || 0)
          const total = formatPrice(service.totalCost || 0)
          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px;">${service.serviceName || "-"}</td>
              <td style="padding: 8px;">${typeLabel}</td>
              <td style="padding: 8px;">${qtyOrDuration}</td>
              <td style="padding: 8px;">${unitPrice}</td>
              <td style="padding: 8px; font-weight: 700; color: #059669;">${total}</td>
            </tr>
          `
        })
        .join("")

      const totalCost = formatPrice(session.totalCost || 0)
      const brandName = ghSettings.name && ghSettings.name.trim() !== '' ? ghSettings.name : '—'

      invoiceDiv.innerHTML = `
        <div style="border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-size: 22px; font-weight: 900; color: #0f172a;">فاکتور جلسه</div>
              <div style="font-size: 14px; color: #334155; font-weight: 700;">${brandName}</div>
            </div>
            <div style="color: #475569;">تاریخ: ${new Date().toLocaleDateString("fa-IR")}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0;">
            <div style="border-radius: 12px; padding: 16px; border: 1px solid #bfdbfe; background-color: #eff6ff;">
              <span style="font-size: 12px; font-weight: 800; margin-bottom: 8px; display: block; color: #0369a1;">مشتری</span>
              <div>${session.customerName || "مهمان"}</div>
            </div>
            <div style="border-radius: 12px; padding: 16px; border: 1px solid #a7f3d0; background-color: #ecfdf5;">
              <span style="font-size: 12px; font-weight: 800; margin-bottom: 8px; display: block; color: #047857;">مبلغ کل</span>
              <div>${totalCost}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0;">
            <div style="border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
              <span style="font-size: 12px; font-weight: 800; margin-bottom: 8px; display: block; color: #0369a1;">شروع جلسه</span>
              <div>${startDate}</div>
            </div>
            <div style="border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
              <span style="font-size: 12px; font-weight: 800; margin-bottom: 8px; display: block; color: #0369a1;">پایان جلسه</span>
              <div>${endDate}</div>
            </div>
          </div>
          
          <div style="margin-top: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: linear-gradient(90deg, #f8fafc, #eff6ff);">
                  <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 800;">خدمات</th>
                  <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 800;">نوع</th>
                  <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 800;">مقدار/مدت</th>
                  <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 800;">قیمت واحد</th>
                  <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; font-weight: 800;">قیمت کل</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHtml}
                <tr>
                  <td colspan="4" style="text-align: left; font-weight: 700; padding: 8px;">جمع کل:</td>
                  <td style="text-align: left; font-weight: 800; color: #059669; padding: 8px;">${totalCost}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `

      document.body.appendChild(invoiceDiv)

      try {
        // Capture the invoice as an image
        const canvas = await html2canvas(invoiceDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.95)
        })
        
        // Create FormData and append the image
        const formData = new FormData()
        formData.append('photo', blob, 'invoice.jpg')
        formData.append('chat_id', telegramSettings.chatId)
        formData.append('caption', `فاکتور جلسه: ${session.customerName || "مهمان"} - ${totalCost}`)
        
        // Send to Telegram
        const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        if (!result.ok) {
          throw new Error(result.description || 'خطا در ارسال به تلگرام')
        }
        
        alert('فاکتور با موفقیت به تلگرام ارسال شد')
      } catch (err) {
        console.error('Failed to send to Telegram:', err)
        alert('خطا در ارسال به تلگرام')
      } finally {
        // Clean up
        if (document.body.contains(invoiceDiv)) {
          document.body.removeChild(invoiceDiv)
        }
      }
    } catch (err) {
      console.error('Failed to send to Telegram:', err)
      alert('خطا در ارسال به تلگرام')
    } finally {
      setIsSendingToTelegram(false)
    }
  }

  const formatDateTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleString("fa-IR", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = () => {
    if (!session.startTime || !session.endTime) return "نامشخص"
    const start = session.startTime instanceof Date ? session.startTime : new Date(session.startTime)
    const end = session.endTime instanceof Date ? session.endTime : new Date(session.endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return hours > 0 ? `${hours} ساعت و ${mins} دقیقه` : `${mins} دقیقه`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 relative">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                جزئیات جلسه
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20 rounded-full w-7 h-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-blue-100 text-xs">
              شناسه: {session.completedSessionId || (session._id || session.id || 'نامشخص')}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">مشتری</p>
                    <p className="font-bold text-sm">{session.customerName || "مهمان"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">اپراتور</p>
                    <p className="font-bold text-sm">{session.completedByOperator || "نامشخص"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">مدت جلسه</p>
                    <p className="font-bold text-sm">{calculateDuration()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">مبلغ کل</p>
                    <p className="font-bold text-green-600">{formatPrice(session.totalCost || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  شروع جلسه
                </div>
                <div className="font-semibold text-sm bg-gray-50 p-2 rounded">
                  {formatDateTime(session.startTime)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  پایان جلسه
                </div>
                <div className="font-semibold text-sm bg-gray-50 p-2 rounded">
                  {session.endTime ? formatDateTime(session.endTime) : "در حال انجام"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                خدمات ارائه شده
                <Badge variant="secondary" className="text-xs">
                  {(session.services || []).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs p-2">خدمت</TableHead>
                      <TableHead className="text-xs p-2 text-center">نوع</TableHead>
                      <TableHead className="text-xs p-2 text-center">مقدار</TableHead>
                      <TableHead className="text-xs p-2 text-center">قیمت واحد</TableHead>
                      <TableHead className="text-xs p-2 text-center">کل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(session.services || []).map((service: any, index: number) => {
                      const typeLabel = service.serviceType === "time-based" ? "زمانی" : "واحدی"
                      const qtyOrDuration = service.serviceType === "time-based"
                        ? `${Math.floor(service.duration || 0)} دقیقه`
                        : `${service.quantity} عدد`
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-xs p-2">{service.serviceName || "-"}</TableCell>
                          <TableCell className="text-xs p-2 text-center">
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {typeLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs p-2 text-center">{qtyOrDuration}</TableCell>
                          <TableCell className="text-xs p-2 text-center">{formatPrice(service.price || 0)}</TableCell>
                          <TableCell className="text-xs p-2 text-center font-bold text-green-600">{formatPrice(service.totalCost || 0)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center bg-green-50 p-2 rounded text-sm">
                <span className="font-semibold">مجموع کل:</span>
                <span className="font-bold text-green-600">{formatPrice(session.totalCost || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {telegramSettings.botToken && telegramSettings.chatId && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSendToTelegram} 
                disabled={isSendingToTelegram}
                className="text-xs"
              >
                <Send className="h-3 w-3 ml-1" />
                {isSendingToTelegram ? "ارسال..." : "تلگرام"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
              className="text-xs"
            >
              <Printer className="h-3 w-3 ml-1" />
              چاپ
            </Button>
            
            <Button 
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              بستن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}