'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ModernSelect } from "@/components/ui/modern-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, DollarSign, User, Phone, Receipt, Plus, Play, Pause, Square, Edit, Trash2, Timer, X } from "lucide-react"
import { Session, Service, SessionService } from "./types"

interface SessionCardProps {
  session: Session
  services: Service[]
  onAddService: (sessionId: string, serviceId: string, quantity: number) => void
  onRemoveService: (sessionId: string, serviceId: string) => void
  onToggleService: (sessionId: string, serviceId: string, action: "pause" | "resume") => void
  onEditService: (sessionId: string, service: SessionService) => void
  onEndSession: (sessionId: string) => void
  onCancelSession: (sessionId: string) => void
  formatDuration: (minutes: number) => string
  formatPrice: (price: number) => string
  getCurrentCost: (service: SessionService) => number
  getCurrentDuration: (service: SessionService) => number
  getSessionDuration: (session: Session) => string
}

export function SessionCard({
  session,
  services,
  onAddService,
  onRemoveService,
  onToggleService,
  onEditService,
  onEndSession,
  onCancelSession,
  formatDuration,
  formatPrice,
  getCurrentCost,
  getCurrentDuration,
  getSessionDuration
}: SessionCardProps) {
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [serviceQuantity, setServiceQuantity] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<SessionService | null>(null)
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false)
  const [isCancelSessionDialogOpen, setIsCancelSessionDialogOpen] = useState(false)

  const handleAddService = () => {
    console.log('handleAddService called with:', {
      selectedService,
      sessionId: session._id || session.id,
      serviceQuantity
    })
    if (selectedService) {
      onAddService(session._id || session.id!, selectedService, serviceQuantity)
      // Reset state and close dialog
      setSelectedService("")
      setServiceQuantity(1)
      setShowAddServiceDialog(false)
    }
  }

  // Reset state when dialog closes
  const handleDialogChange = (open: boolean) => {
    setShowAddServiceDialog(open)
    if (!open) {
      setSelectedService("")
      setServiceQuantity(1)
    }
  }

  const handleRemoveService = (service: SessionService) => {
    setServiceToDelete(service)
    setIsDeleteDialogOpen(true)
  }

  const confirmRemoveService = () => {
    if (serviceToDelete) {
      onRemoveService(session._id || session.id!, serviceToDelete.serviceId)
      setIsDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  const handleEndSession = () => {
    setIsEndSessionDialogOpen(true)
  }

  const confirmEndSession = () => {
    onEndSession(session._id || session.id!)
    setIsEndSessionDialogOpen(false)
  }

  const handleCancelSession = () => {
    setIsCancelSessionDialogOpen(true)
  }

  const confirmCancelSession = () => {
    onCancelSession(session._id || session.id!)
    setIsCancelSessionDialogOpen(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 via-indigo-600 to-purple-600 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${
              session.status === "active" ? "bg-green-400 animate-pulse" : "bg-orange-400"
            }`}></div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="h-4 w-4 text-white" />
              <span className="font-semibold text-white">{getSessionDuration(session)}</span>
            </div>
            <Badge 
              variant="outline" 
              className={`border-white/30 text-white bg-white/10 backdrop-blur-sm ${
                session.status === "active" ? "" : "bg-orange-500/20"
              }`}
            >
              {session.status === "active" ? "فعال" : "متوقف"}
            </Badge>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-white mb-1">{session.customerName}</h3>
            <p className="text-blue-100 text-sm flex items-center gap-2 justify-end">
              <span>{session.customerPhone}</span>
              <Phone className="h-4 w-4" />
            </p>
            <p className="text-blue-200 text-xs mt-2 opacity-90">
              شروع: {session.startTime.toLocaleString("fa-IR")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Services Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">سرویس‌های جلسه</h4>
              </div>
              <Dialog open={showAddServiceDialog} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    افزودن سرویس
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] max-h-[50vh] rounded-2xl border-2 border-slate-200" onInteractOutside={(e: any) => {
                  const target = e.target as HTMLElement | null
                  if (target && (target.closest('[class*="modern-select__menu"]') || target.closest('[class*="modern-select__control"]') || target.closest('[class*="modern-select__option"]'))) {
                    e.preventDefault()
                  }
                }}>
                  <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg font-bold">افزودن سرویس جدید</DialogTitle>
                    <DialogDescription className="text-sm">
                      سرویس مورد نظر را انتخاب کنید
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="service-select" className="text-sm">انتخاب سرویس</Label>
                      <ModernSelect
                        options={services.filter(s => s.isActive).map(service => ({
                          value: service._id || service.id!,
                          label: `${service.name} - ${formatPrice(service.price)} (${service.type === "time-based" ? "زمانی" : "واحدی"})`,
                          searchText: [service.name, service.type === "time-based" ? "زمانی" : "واحدی"].join(' '),
                        }))}
                        value={selectedService}
                        onValueChange={(v: string) => setSelectedService(v)}
                        placeholder="سرویس را انتخاب کنید"
                        className="w-full"
                      />
                    </div>
                    {selectedService && services.find(s => (s._id || s.id) === selectedService)?.type === "unit-based" && (
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm">تعداد</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => handleDialogChange(false)} size="sm">
                        انصراف
                      </Button>
                      <Button onClick={handleAddService} disabled={!selectedService} size="sm">
                        افزودن
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Services Table */}
            {session.services.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">هیچ سرویسی اضافه نشده</h3>
                <p className="text-gray-500 text-sm">برای شروع، یک سرویس اضافه کنید</p>
              </div>
            ) : (
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                      <TableHead className="text-right font-bold text-white">عملیات</TableHead>
                      <TableHead className="text-right font-bold text-white flex items-center gap-2 justify-end">
                        <DollarSign className="h-4 w-4" />
                        هزینه
                      </TableHead>
                      <TableHead className="text-right font-bold text-white flex items-center gap-2 justify-end">
                        <Timer className="h-4 w-4" />
                        مدت/تعداد
                      </TableHead>
                      <TableHead className="text-right font-bold text-white">وضعیت</TableHead>
                      <TableHead className="text-right font-bold text-white">نوع</TableHead>
                      <TableHead className="text-right font-bold text-white flex items-center gap-2 justify-end">
                        <Receipt className="h-4 w-4" />
                        سرویس
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.services.map((service, index) => (
                      <TableRow key={`${session.id}-service-${index}-${service.serviceId}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-slate-100">
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {service.serviceType === "time-based" && (
                              !service.isPaused ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onToggleService(session._id || session.id!, service.serviceId, "pause")}
                                  className="h-8 w-8 p-0 border-orange-300 hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 hover:text-white transition-all duration-200 shadow-sm"
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onToggleService(session._id || session.id!, service.serviceId, "resume")}
                                  className="h-8 w-8 p-0 border-green-300 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 hover:text-white transition-all duration-200 shadow-sm"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditService(session._id || session.id!, service)}
                              className="h-8 w-8 p-0 border-blue-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all duration-200 shadow-sm"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveService(service)}
                              className="h-8 w-8 p-0 border-red-300 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white transition-all duration-200 shadow-sm"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm inline-block">
                            {formatPrice(getCurrentCost(service))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
                            {service.serviceType === "time-based" 
                              ? `${formatDuration(getCurrentDuration(service))}`
                              : `${service.quantity} عدد`
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {service.serviceType === "time-based" && (
                            <Badge 
                              variant="outline" 
                              className={`${
                                service.isPaused 
                                  ? "border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 shadow-sm" 
                                  : "border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm"
                              }`}
                            >
                              {service.isPaused ? "⏸️ متوقف" : "▶️ در حال اجرا"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block shadow-sm ${
                            service.serviceType === "time-based" 
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200" 
                              : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200"
                          }`}>
                            {service.serviceType === "time-based" ? "⏱️ زمانی" : "📦 واحدی"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="bg-gradient-to-r from-gray-100 to-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium inline-block border border-slate-200">
                            {service.serviceName}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Total Cost and Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-6 py-3 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">مجموع هزینه</p>
                    <p className="text-lg font-bold text-emerald-600">{formatPrice(session.totalCost || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCancelSession}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                لغو جلسه
              </Button>
              <Button
                onClick={handleEndSession}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Square className="h-4 w-4 mr-2" />
                پایان جلسه
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تایید حذف سرویس</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-gray-600">
              آیا از حذف سرویس "{serviceToDelete ? services.find(s => s._id === serviceToDelete.serviceId)?.name || 'نامشخص' : ''}" از این جلسه اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel 
              className="mt-0"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setServiceToDelete(null)
              }}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveService}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEndSessionDialogOpen} onOpenChange={setIsEndSessionDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تایید پایان جلسه</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-gray-600">
              آیا از پایان دادن به جلسه "{session.customerName}" اطمینان دارید؟ پس از پایان جلسه، امکان ادامه آن وجود نخواهد داشت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel 
              className="mt-0"
              onClick={() => setIsEndSessionDialogOpen(false)}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEndSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              پایان جلسه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelSessionDialogOpen} onOpenChange={setIsCancelSessionDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تایید لغو جلسه</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-gray-600">
              آیا از لغو و حذف کامل جلسه "{session.customerName}" اطمینان دارید؟ تمام اطلاعات جلسه و سرویس‌های آن حذف خواهد شد و این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel 
              className="mt-0"
              onClick={() => setIsCancelSessionDialogOpen(false)}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              لغو و حذف جلسه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}