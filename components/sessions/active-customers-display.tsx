'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ModernSelect } from "@/components/ui/modern-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, Activity, Timer, DollarSign, Receipt, Plus, Play, Pause, Square, Edit, Trash2, ChevronDown, ChevronUp, Gamepad2, Coffee, Zap, X } from "lucide-react"
import { Session, Service, SessionService } from "./types"
import { getCurrentDuration as getServiceCurrentDuration, getSessionDurationHHMM, getTimeBasedServicesDurationHHMM } from "./utils"

interface ActiveCustomersDisplayProps {
  activeSessions: Session[]
  services: Service[]
  onAddService: (sessionId: string, serviceId: string, quantity: number) => Promise<void>
  onRemoveService: (sessionId: string, serviceId: string) => Promise<void>
  onToggleService: (sessionId: string, serviceId: string, action: "pause" | "resume") => Promise<void>
  onEditService: (sessionId: string, service: SessionService) => void
  onEndSession: (sessionId: string) => Promise<void>
  onCancelSession: (sessionId: string) => Promise<void>
  formatDuration: (minutes: number) => string
  formatPrice: (price: number) => string
  getCurrentCost: (session: Session) => number
  getCurrentDuration: (session: Session) => number
  getSessionDuration: (session: Session) => string
}

export function ActiveCustomersDisplay({
  activeSessions,
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
}: ActiveCustomersDisplayProps) {
  const [selectedService, setSelectedService] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState<{ sessionId: string; serviceId: string } | null>(null)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState<string | null>(null)
  const [showCancelSessionDialog, setShowCancelSessionDialog] = useState<string | null>(null)
  const [showCostCalculationDialog, setShowCostCalculationDialog] = useState<string | null>(null)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const handleAddService = async (sessionId: string) => {
    if (selectedService && quantity > 0) {
      await onAddService(sessionId, selectedService, quantity)
      setSelectedService('')
      setQuantity(1)
      setShowAddServiceDialog(null)
    }
  }

  const handleRemoveService = async () => {
    if (showRemoveDialog) {
      await onRemoveService(showRemoveDialog.sessionId, showRemoveDialog.serviceId)
      setShowRemoveDialog(null)
    }
  }

  const handleEndSession = async () => {
    if (showEndSessionDialog) {
      await onEndSession(showEndSessionDialog)
      setShowEndSessionDialog(null)
    }
  }

  const handleCancelSession = async () => {
    if (showCancelSessionDialog) {
      await onCancelSession(showCancelSessionDialog)
      setShowCancelSessionDialog(null)
    }
  }

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('gaming') || name.includes('xbox') || name.includes('pc') || name.includes('vr')) {
      return <Gamepad2 className="h-4 w-4" />
    }
    if (name.includes('قهوه') || name.includes('نوشیدنی') || name.includes('اسنک')) {
      return <Coffee className="h-4 w-4" />
    }
    return <Zap className="h-4 w-4" />
  }

  if (activeSessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
            <Activity className="h-12 w-12 text-slate-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse opacity-60"></div>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">هیچ جلسه فعالی وجود ندارد</h3>
        <p className="text-slate-500 mb-6">برای شروع، یک جلسه جدید ایجاد کنید</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 rounded-full text-sm font-medium border border-slate-300">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
          آماده برای شروع
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      {/* Sessions Grid */}
      <div className="space-y-4">
        {activeSessions.map((session) => {
          const sessionId = (session._id || session.id)!
          const isExpanded = expandedSessions.has(sessionId)
          
          return (
            <Card key={sessionId} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSessionExpansion(sessionId)}
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCostCalculationDialog(sessionId)}
                        className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelSessionDialog(sessionId)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <X className="h-4 w-4 mr-1" />
                        لغو
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowEndSessionDialog(sessionId)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        پایان
                      </Button>
                    </div>

                    {/* Session Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-blue-600 mb-1">
                          <Timer className="h-4 w-4" />
                          <span className="font-semibold">{getTimeBasedServicesDurationHHMM(session)}</span>
                        </div>
                        <p className="text-xs text-slate-500">سرویس‌های زمان‌پایه</p>
                      </div>
                      
                      <div className="text-center">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                          {session.services.length} سرویس
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <h3 className="font-semibold text-slate-800 text-lg">{session.customerName}</h3>
                      </div>
                      <Avatar className="w-12 h-12 border-2 border-slate-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold">
                          {session.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Expandable Services Section */}
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-700 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          سرویس‌های فعال
                        </h4>
                        <Dialog open={showAddServiceDialog === sessionId} onOpenChange={(open) => setShowAddServiceDialog(open ? sessionId : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="bg-white border-slate-300 hover:bg-slate-50">
                              <Plus className="h-4 w-4 mr-1" />
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
                              <DialogTitle className="text-lg font-bold">افزودن سرویس</DialogTitle>
                              <DialogDescription className="text-sm">
                                سرویس جدید برای {session.customerName} انتخاب کنید
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 overflow-y-auto">
                              <div className="space-y-2">
                                <Label htmlFor="service" className="text-sm">سرویس</Label>
                                <ModernSelect
                                  options={services.filter(service => service._id || service.id).map(service => ({
                                    value: (service._id || service.id)!,
                                    label: service.name,
                                    searchText: [service.name, service.type === 'time-based' ? 'زمانی' : 'واحدی'].join(' '),
                                  }))}
                                  value={selectedService}
                                  onValueChange={(value) => setSelectedService(value || '')}
                                  placeholder="انتخاب سرویس..."
                                />
                              </div>
                              {selectedService && services.find(s => (s._id || s.id) === selectedService)?.type === "unit-based" && (
                                <div className="space-y-2">
                                  <Label htmlFor="quantity" className="text-sm">تعداد</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="border-slate-300 h-9"
                                  />
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  onClick={() => selectedService && handleAddService(sessionId)} 
                                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                                  size="sm"
                                >
                                  افزودن
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowAddServiceDialog(null)}
                                  className="border-slate-300 hover:bg-slate-50"
                                  size="sm"
                                >
                                  لغو
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {session.services.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">هیچ سرویسی اضافه نشده است</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {session.services.map((sessionService) => {
                            const service = services.find(s => (s._id || s.id) === sessionService.serviceId)
                            if (!service) return null
                            
                            return (
                              <div key={sessionService.serviceId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-1">
                                  {sessionService.serviceType === "time-based" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        if (sessionService.serviceId) {
                                          const action = sessionService.isPaused ? "resume" : "pause"
                                          onToggleService(sessionId, sessionService.serviceId, action)
                                        }
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-slate-100"
                                      title={sessionService.isPaused ? 'ادامه' : 'توقف'}
                                    >
                                      {sessionService.isPaused ? (
                                        <Play className="h-4 w-4 text-emerald-600" />
                                      ) : (
                                        <Pause className="h-4 w-4 text-amber-600" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEditService(sessionId, sessionService)}
                                    className="h-8 w-8 p-0 hover:bg-slate-100"
                                    title="ویرایش"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => sessionService.serviceId && setShowRemoveDialog({ sessionId, serviceId: sessionService.serviceId })}
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                    title="حذف"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                  <div className="text-right">
                                    <div className="font-medium text-slate-800">{service.name}</div>
                                    <div className="text-sm text-slate-500">
                                      {sessionService.serviceType === "time-based" ? (
                                         <>
                                           {getServiceCurrentDuration(sessionService)} دقیقه سپری شده
                                         </>
                                       ) : (
                                         <>
                                           تعداد: {sessionService.quantity}
                                         </>
                                       )}
                                    </div>
                                  </div>
                                  <div className="text-slate-600">
                                    {getServiceIcon(service.name)}
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${
                                    sessionService.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                                  } animate-pulse shadow-sm`}></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          )
        })}
      </div>



      {/* Remove Service Dialog */}
      <AlertDialog open={!!showRemoveDialog} onOpenChange={() => setShowRemoveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">حذف سرویس</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              آیا مطمئن هستید که می‌خواهید این سرویس را حذف کنید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">لغو</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveService} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Session Dialog */}
      <AlertDialog open={!!showEndSessionDialog} onOpenChange={() => setShowEndSessionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">پایان جلسه</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              آیا مطمئن هستید که می‌خواهید این جلسه را پایان دهید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">لغو</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} className="bg-red-500 hover:bg-red-600">پایان جلسه</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Session Dialog */}
      <AlertDialog open={!!showCancelSessionDialog} onOpenChange={() => setShowCancelSessionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">لغو جلسه</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              آیا مطمئن هستید که می‌خواهید این جلسه را لغو کنید؟ تمام اطلاعات جلسه حذف خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSession} className="bg-red-500 hover:bg-red-600">لغو و حذف جلسه</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cost Calculation Dialog */}
      <Dialog open={showCostCalculationDialog !== null} onOpenChange={(open) => setShowCostCalculationDialog(open ? showCostCalculationDialog : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">محاسبه هزینه‌ها</DialogTitle>
            <DialogDescription className="text-slate-600">
              خلاصه هزینه‌های جلسه
            </DialogDescription>
          </DialogHeader>
          {showCostCalculationDialog && (() => {
            const session = activeSessions.find(s => (s._id || s.id) === showCostCalculationDialog)
            if (!session) return null
            
            return (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-3">جزئیات سرویس‌ها</h4>
                  <div className="space-y-2">
                    {session.services.map((sessionService) => {
                      const service = services.find(s => s._id === sessionService.serviceId || s.id === sessionService.serviceId)
                      if (!service) return null
                      
                      let serviceCost = 0
                      let displayText = ''
                      
                      if (sessionService.serviceType === 'time-based') {
                        // For time-based services, use duration in minutes
                        const duration = getServiceCurrentDuration(sessionService)
                        serviceCost = duration * service.price
                        displayText = `${service.name} (${duration} دقیقه)`
                      } else {
                        // For unit-based services, use quantity
                        serviceCost = sessionService.quantity * service.price
                        displayText = `${service.name} × ${sessionService.quantity}`
                      }
                      
                      return (
                        <div key={sessionService.serviceId} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">
                            {displayText}
                          </span>
                          <span className="font-medium text-slate-800">
                            {formatPrice(serviceCost)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">مجموع کل:</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {formatPrice(session.services.reduce((total, sessionService) => {
                        const service = services.find(s => s._id === sessionService.serviceId || s.id === sessionService.serviceId)
                        if (!service) return total
                        
                        if (sessionService.serviceType === 'time-based') {
                          const duration = getServiceCurrentDuration(sessionService)
                          return total + (duration * service.price)
                        } else {
                          return total + (sessionService.quantity * service.price)
                        }
                      }, 0))}
                    </span>
                  </div>

                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}