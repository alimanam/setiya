"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, ArrowLeft, Image, Building2, Phone, Instagram, FileText, Database, Clock, Download, HardDrive, AlertCircle, Send, Eye, EyeOff } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

export default function SettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [logoUrl, setLogoUrl] = useState("")
  const [ghName, setGhName] = useState("")
  const [ghAddress, setGhAddress] = useState("")
  const [ghPhone, setGhPhone] = useState("")
  const [ghInstagram, setGhInstagram] = useState("")
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logRetentionOption, setLogRetentionOption] = useState('6_months')
  const [isLoadingLogSettings, setIsLoadingLogSettings] = useState(false)
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [backupStatus, setBackupStatus] = useState('')
  const [backupId, setBackupId] = useState('')
  const [backupDownloadUrl, setBackupDownloadUrl] = useState('')
  const [backupError, setBackupError] = useState('')
  const [availableCollections, setAvailableCollections] = useState<any[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false)
  const [showTelegramToken, setShowTelegramToken] = useState(false)
  const [isSavingTelegram, setIsSavingTelegram] = useState(false)

  useEffect(() => {
    const operatorData = localStorage.getItem('operator')
    if (operatorData) {
      const user = JSON.parse(operatorData)
      setCurrentUser(user)
      
      // Check if user is admin
      if (user.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    }

    // Load settings from database
    loadSettings()
    loadLogRetentionSettings()
    loadAvailableCollections()
  }, [router])

  const loadAvailableCollections = async () => {
    try {
      const response = await fetch('/api/admin/backup/collections')
      const data = await response.json()
      
      if (data.success) {
        setAvailableCollections(data.collections)
        // Select all collections by default
        setSelectedCollections(data.collections.map((c: any) => c.name))
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.settings)) {
        const byKey: Record<string, any> = {}
        for (const s of data.settings) {
          if (s?.key) byKey[s.key] = s.value
        }
        if (byKey['gaming_house_logo']) setLogoUrl(byKey['gaming_house_logo'])
        if (byKey['gaming_house_name']) setGhName(byKey['gaming_house_name'])
        if (byKey['gaming_house_address']) setGhAddress(byKey['gaming_house_address'])
        if (byKey['gaming_house_phone']) setGhPhone(byKey['gaming_house_phone'])
        if (byKey['gaming_house_instagram']) setGhInstagram(byKey['gaming_house_instagram'])
        if (byKey['telegram_bot_token']) setTelegramBotToken(byKey['telegram_bot_token'])
        if (byKey['telegram_chat_id']) setTelegramChatId(byKey['telegram_chat_id'])
      } else if (data.success && data.setting) {
        // backward compatibility when API returned single setting
        if (data.setting.key === 'gaming_house_logo') setLogoUrl(data.setting.value)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLogRetentionSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/log-retention')
      const data = await response.json()
      
      if (data.success) {
        setLogRetentionOption(data.data.retentionOption)
      }
    } catch (error) {
      console.error('Error loading log retention settings:', error)
    }
  }

  const handleSaveLogRetention = async () => {
    setIsLoadingLogSettings(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings/log-retention', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionOption: logRetentionOption })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.message || 'خطا در ذخیره تنظیمات نگهداری لاگ‌ها' })
      }
    } catch (error) {
      console.error('Error saving log retention settings:', error)
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setIsLoadingLogSettings(false)
    }
  }

  const handleStartBackup = async () => {
    setIsBackupInProgress(true)
    setBackupProgress(0)
    setBackupStatus('شروع بک‌آپ...')
    setBackupError('')
    setBackupDownloadUrl('')
    setMessage(null)

    try {
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedCollections: selectedCollections })
      })

      const data = await response.json()

      if (data.success) {
        setBackupId(data.backupId)
        // Start listening to progress updates
        listenToBackupProgress(data.backupId)
      } else {
        setBackupError(data.message || 'خطا در شروع بک‌آپ')
        setIsBackupInProgress(false)
      }
    } catch (error) {
      console.error('Error starting backup:', error)
      setBackupError('خطا در ارتباط با سرور')
      setIsBackupInProgress(false)
    }
  }

  const listenToBackupProgress = (backupId: string) => {
    const eventSource = new EventSource(`/api/admin/backup/progress?backupId=${backupId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        setBackupProgress(data.progress || 0)
        setBackupStatus(data.status || '')
        
        if (data.status === 'completed') {
          setBackupDownloadUrl(data.downloadUrl || '')
          setIsBackupInProgress(false)
          setMessage({ type: 'success', text: 'بک‌آپ با موفقیت تکمیل شد' })
          eventSource.close()
        } else if (data.status === 'error') {
          setBackupError(data.error || 'خطا در فرآیند بک‌آپ')
          setIsBackupInProgress(false)
          eventSource.close()
        }
      } catch (error) {
        console.error('Error parsing progress data:', error)
      }
    }

    eventSource.onerror = () => {
      setBackupError('خطا در دریافت وضعیت بک‌آپ')
      setIsBackupInProgress(false)
      eventSource.close()
    }
  }

  const handleDownloadBackup = () => {
    if (backupDownloadUrl) {
      window.open(backupDownloadUrl, '_blank')
    }
  }

  const handleSendToTelegram = async () => {
    if (!backupDownloadUrl || !telegramBotToken || !telegramChatId) {
      setMessage({ type: 'error', text: 'لطفاً ابتدا تنظیمات تلگرام را تکمیل کنید' })
      return
    }

    setIsSendingToTelegram(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/backup/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupUrl: backupDownloadUrl,
          botToken: telegramBotToken,
          chatId: telegramChatId
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'فایل بک‌آپ با موفقیت به تلگرام ارسال شد' })
      } else {
        setMessage({ type: 'error', text: result.error || 'خطا در ارسال فایل به تلگرام' })
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error)
      setMessage({ type: 'error', text: 'خطا در ارسال فایل به تلگرام' })
    } finally {
      setIsSendingToTelegram(false)
    }
  }

  const handleSaveTelegramSettings = async () => {
    setIsSavingTelegram(true)
    setMessage(null)

    try {
      const payloads = [
        { key: 'telegram_bot_token', value: telegramBotToken.trim(), description: 'توکن بات تلگرام' },
        { key: 'telegram_chat_id', value: telegramChatId.trim(), description: 'شناسه کانال تلگرام' },
      ]

      const responses = await Promise.all(payloads.map(p => 
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        })
      ))

      const results = await Promise.all(responses.map(r => r.json()))
      const allSuccess = results.every((res) => res.success)

      if (allSuccess) {
        setMessage({ type: 'success', text: 'تنظیمات تلگرام با موفقیت ذخیره شد' })
      } else {
        setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات تلگرام. لطفاً دوباره تلاش کنید.' })
      }
    } catch (error) {
      console.error('Error saving telegram settings:', error)
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات تلگرام' })
    } finally {
      setIsSavingTelegram(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const payloads = [
        { key: 'gaming_house_logo', value: logoUrl.trim(), description: 'URL لوگوی خانه بازی' },
        { key: 'gaming_house_name', value: ghName.trim(), description: 'نام خانه بازی' },
        { key: 'gaming_house_address', value: ghAddress.trim(), description: 'آدرس خانه بازی' },
        { key: 'gaming_house_phone', value: ghPhone.trim(), description: 'شماره تماس خانه بازی' },
        { key: 'gaming_house_instagram', value: ghInstagram.trim(), description: 'آدرس پروفایل اینستاگرام خانه بازی' },
        { key: 'telegram_bot_token', value: telegramBotToken.trim(), description: 'توکن بات تلگرام' },
        { key: 'telegram_chat_id', value: telegramChatId.trim(), description: 'شناسه کانال تلگرام' },
      ]

      const responses = await Promise.all(payloads.map(p => 
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        })
      ))

      const results = await Promise.all(responses.map(r => r.json()))
      const allSuccess = results.every((res) => res.success)

      if (allSuccess) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' })
      } else {
        setMessage({ type: 'error', text: 'برخی از تنظیمات ذخیره نشد. لطفاً دوباره تلاش کنید.' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">دسترسی محدود</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              این صفحه فقط برای مدیران سیستم قابل دسترسی است.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              بازگشت به داشبورد
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                بازگشت
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  تنظیمات سیستم
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Settings Sections using Accordion */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                تنظیمات عمومی سیستم
              </CardTitle>
              <CardDescription>
                مدیریت اطلاعات اساسی و ظاهری سیستم
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                
                {/* Brand Identity Section */}
                <AccordionItem value="brand" className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <div className="text-right">
                        <div className="font-semibold">هویت برند</div>
                        <div className="text-sm text-slate-500">نام و لوگوی خانه بازی</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      
                      {/* Gaming House Name */}
                      <div className="space-y-2">
                        <Label htmlFor="ghName">نام خانه بازی</Label>
                        <Input
                          id="ghName"
                          type="text"
                          value={ghName}
                          onChange={(e) => setGhName(e.target.value)}
                          placeholder="ستیا گیمینگ هاوس"
                          className="text-right"
                        />
                        <p className="text-sm text-gray-500">
                          نام خانه بازی که در فاکتورها و سراسر سیستم نمایش داده می‌شود
                        </p>
                      </div>

                      {/* Logo URL */}
                      <div className="space-y-2">
                        <Label htmlFor="logoUrl">آدرس لوگو (URL)</Label>
                        <Input
                          id="logoUrl"
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="text-right"
                          dir="ltr"
                        />
                        <p className="text-sm text-gray-500">
                          لینک تصویر لوگو را وارد کنید. برای حذف لوگو، این فیلد را خالی بگذارید.
                        </p>
                      </div>

                      {/* Logo Preview */}
                      {logoUrl && (
                        <div className="space-y-2">
                          <Label>پیش‌نمایش لوگو</Label>
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <img 
                              src={logoUrl} 
                              alt="Logo Preview" 
                              className="max-h-20 mx-auto"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Contact Information Section */}
                <AccordionItem value="contact" className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-600" />
                      <div className="text-right">
                        <div className="font-semibold">اطلاعات تماس</div>
                        <div className="text-sm text-slate-500">آدرس، تلفن و شبکه‌های اجتماعی</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      
                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="ghAddress">آدرس خانه بازی</Label>
                        <Textarea
                          id="ghAddress"
                          value={ghAddress}
                          onChange={(e) => setGhAddress(e.target.value)}
                          placeholder="تهران، ... خیابان ... پلاک ..."
                          className="text-right min-h-24"
                        />
                        <p className="text-sm text-gray-500">
                          آدرس کامل خانه بازی که در فاکتورها چاپ می‌شود
                        </p>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="ghPhone">شماره تماس</Label>
                        <Input
                          id="ghPhone"
                          type="tel"
                          value={ghPhone}
                          onChange={(e) => setGhPhone(e.target.value)}
                          placeholder="09xxxxxxxxx یا 021-xxxxxxx"
                          className="text-right"
                          dir="ltr"
                        />
                        <p className="text-sm text-gray-500">
                          شماره تماس اصلی خانه بازی
                        </p>
                      </div>

                      {/* Instagram */}
                      <div className="space-y-2">
                        <Label htmlFor="ghInstagram" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          آدرس پروفایل اینستاگرام
                        </Label>
                        <Input
                          id="ghInstagram"
                          type="text"
                          value={ghInstagram}
                          onChange={(e) => setGhInstagram(e.target.value)}
                          placeholder="@setia_gaming_house یا https://instagram.com/setia_gaming_house"
                          className="text-right"
                          dir="ltr"
                        />
                        <p className="text-sm text-gray-500">
                          می‌توانید نام کاربری (با یا بدون @) یا لینک کامل را وارد کنید. QR کد این آدرس در فاکتور چاپ می‌شود.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Telegram Bot Settings Section */}
                <AccordionItem value="telegram" className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-slate-600" />
                      <div className="text-right">
                        <div className="font-semibold">تنظیمات بات تلگرام</div>
                        <div className="text-sm text-slate-500">ارسال بک‌آپ به کانال تلگرام</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      
                      {/* Bot Token */}
                      <div className="space-y-2">
                        <Label htmlFor="telegramBotToken">توکن بات تلگرام</Label>
                        <div className="relative">
                          <Input
                            id="telegramBotToken"
                            type={showTelegramToken ? "text" : "password"}
                            value={telegramBotToken}
                            onChange={(e) => setTelegramBotToken(e.target.value)}
                            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                            className="text-left pr-10"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowTelegramToken(!showTelegramToken)}
                          >
                            {showTelegramToken ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                          توکن بات تلگرام را از @BotFather دریافت کنید
                        </p>
                      </div>

                      {/* Chat ID */}
                      <div className="space-y-2">
                        <Label htmlFor="telegramChatId">شناسه کانال تلگرام</Label>
                        <Input
                          id="telegramChatId"
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="@channel_name یا -1001234567890"
                          className="text-left"
                          dir="ltr"
                        />
                        <p className="text-sm text-gray-500">
                          نام کانال (با @) یا شناسه عددی کانال را وارد کنید
                        </p>
                      </div>

                      {/* Telegram Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Send className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-2">راهنمای تنظیم:</p>
                            <ul className="space-y-1 text-right">
                              <li>• ابتدا یک بات جدید از @BotFather بسازید</li>
                              <li>• بات را به کانال خود اضافه کنید و ادمین کنید</li>
                              <li>• توکن بات و شناسه کانال را در فیلدهای بالا وارد کنید</li>
                              <li>• پس از ذخیره، می‌توانید فایل‌های بک‌آپ را به تلگرام ارسال کنید</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Save Telegram Settings Button */}
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSaveTelegramSettings}
                          disabled={isSavingTelegram}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4 ml-2" />
                          {isSavingTelegram ? "در حال ذخیره..." : "ذخیره تنظیمات تلگرام"}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Log Retention Section */}
                <AccordionItem value="log-retention" className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-slate-600" />
                      <div className="text-right">
                        <div className="font-semibold">مدیریت لاگ‌های فعالیت</div>
                        <div className="text-sm text-slate-500">تنظیم مدت زمان نگهداری لاگ‌ها</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      
                      {/* Log Retention Setting */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600" />
                          <Label htmlFor="logRetention">مدت زمان نگهداری لاگ‌ها</Label>
                        </div>
                        
                        <Select value={logRetentionOption} onValueChange={setLogRetentionOption}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب مدت زمان نگهداری" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1_month">یک ماه</SelectItem>
                            <SelectItem value="3_months">سه ماه</SelectItem>
                            <SelectItem value="6_months">شش ماه (پیش‌فرض)</SelectItem>
                            <SelectItem value="1_year">یک سال</SelectItem>
                            <SelectItem value="never">هیچوقت حذف نشوند</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-2">توضیحات:</p>
                              <ul className="space-y-1 text-right">
                                <li>• لاگ‌های فعالیت اپراتورها بعد از مدت زمان انتخابی به صورت خودکار حذف می‌شوند</li>
                                <li>• این تنظیم بر روی لاگ‌های جدید و موجود اعمال می‌شود</li>
                                <li>• انتخاب "هیچوقت حذف نشوند" باعث انباشت داده‌ها می‌شود</li>
                                <li>• تغییر این تنظیم فوراً اعمال می‌شود</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleSaveLogRetention}
                          disabled={isLoadingLogSettings}
                          className="w-full flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isLoadingLogSettings ? "در حال ذخیره..." : "ذخیره تنظیمات نگهداری لاگ‌ها"}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Database Backup Section */}
                <AccordionItem value="database-backup" className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-slate-600" />
                      <div className="text-right">
                        <div className="font-semibold">بک‌آپ پایگاه داده</div>
                        <div className="text-sm text-slate-500">تهیه نسخه پشتیبان از تمام داده‌ها</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      
                      {/* Collection Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">انتخاب کالکشن‌ها برای بک‌آپ</Label>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCollections(availableCollections.map(c => c.name))}
                            >
                              انتخاب همه
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCollections([])}
                            >
                              حذف انتخاب همه
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableCollections.map((collection) => (
                            <div key={collection.name} className="flex items-start space-x-3 space-x-reverse">
                              <input
                                type="checkbox"
                                id={collection.name}
                                checked={selectedCollections.includes(collection.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCollections([...selectedCollections, collection.name])
                                  } else {
                                    setSelectedCollections(selectedCollections.filter(c => c !== collection.name))
                                  }
                                }}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <label htmlFor={collection.name} className="text-sm font-medium text-gray-900 cursor-pointer">
                                  {collection.label}
                                </label>
                                <p className="text-xs text-gray-500">{collection.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Backup Description */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-2">توضیحات مهم:</p>
                            <ul className="space-y-1 text-right">
                              <li>• هر کالکشن در فایل جداگانه‌ای ذخیره می‌شود</li>
                              <li>• فرآیند بک‌آپ ممکن است چند دقیقه طول بکشد</li>
                              <li>• فایل‌های بک‌آپ در یک فایل ZIP قرار می‌گیرند</li>
                              <li>• حین فرآیند بک‌آپ، سیستم به طور عادی کار می‌کند</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Backup Progress */}
                      {isBackupInProgress && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">پیشرفت بک‌آپ</span>
                            <span className="text-sm text-slate-600">{Math.round(backupProgress)}%</span>
                          </div>
                          <Progress value={backupProgress} className="w-full" />
                          <p className="text-sm text-slate-600">{backupStatus}</p>
                        </div>
                      )}

                      {/* Backup Error */}
                      {backupError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{backupError}</AlertDescription>
                        </Alert>
                      )}

                      {/* Backup Actions */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleStartBackup}
                          disabled={isBackupInProgress || selectedCollections.length === 0}
                          className="flex-1 flex items-center gap-2"
                        >
                          <HardDrive className="h-4 w-4" />
                          {isBackupInProgress ? "در حال تهیه بک‌آپ..." : selectedCollections.length === 0 ? "لطفاً حداقل یک کالکشن انتخاب کنید" : "شروع بک‌آپ"}
                        </Button>
                        
                        {backupDownloadUrl && (
                          <>
                            <Button 
                              onClick={handleDownloadBackup}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              دانلود بک‌آپ
                            </Button>
                            
                            <Button 
                              onClick={handleSendToTelegram}
                              disabled={isSendingToTelegram || !telegramBotToken || !telegramChatId}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Send className="h-4 w-4" />
                              {isSendingToTelegram ? "در حال ارسال..." : "ارسال به تلگرام"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </CardContent>
          </Card>

          {/* Message Alert */}
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isLoading || isSaving}
                className="w-full flex items-center gap-2 h-12 text-base"
              >
                <Save className="h-5 w-5" />
                {isSaving ? "در حال ذخیره..." : "ذخیره همه تنظیمات"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </AuthGuard>
  )
}