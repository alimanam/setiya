'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { SessionService } from "./types"
import { convertPersianToGregorian, convertGregorianToPersian } from "./utils"

interface EditServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: SessionService | null
  onSave: (quantity: number, persianDate: string, time: string, endPersianDate?: string, endTime?: string) => void
  formatPrice: (price: number) => string
  convertGregorianToPersian: (date: Date) => string
  getCurrentCost: (service: SessionService) => number
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
  onSave,
  formatPrice,
  convertGregorianToPersian,
  getCurrentCost
}: EditServiceDialogProps) {
  const [editServiceQuantity, setEditServiceQuantity] = useState(1)
  const [editServicePersianDate, setEditServicePersianDate] = useState("")
  const [editServiceTime, setEditServiceTime] = useState("")
  const [editServiceEndPersianDate, setEditServiceEndPersianDate] = useState("")
  const [editServiceEndTime, setEditServiceEndTime] = useState("")
  const [calculatedTotalCost, setCalculatedTotalCost] = useState(0)

  // Function to calculate total cost based on current inputs
  const calculateTotalCost = useCallback(() => {
    if (!service) return 0
    
    if (service.serviceType === "unit-based") {
      return service.price * editServiceQuantity
    } else if (service.serviceType === "time-based") {
      if (!editServicePersianDate || !editServiceTime) return getCurrentCost(service)
      
      try {
        const newStartTime = convertPersianToGregorian(editServicePersianDate, editServiceTime)
        
        let endTime: Date
        if (editServiceEndPersianDate && editServiceEndTime) {
          // Use edited end time if provided
          endTime = convertPersianToGregorian(editServiceEndPersianDate, editServiceEndTime)
        } else {
          // Use current time if no end time is specified
          endTime = new Date()
        }
        
        const durationMinutes = Math.max(0, Math.floor((endTime.getTime() - newStartTime.getTime()) / (1000 * 60)))
        
        // Apply same logic as backend: < 1 minute => cost = 0
        return durationMinutes < 1 ? 0 : Math.floor(durationMinutes * (service.price || 0))
      } catch {
        return getCurrentCost(service)
      }
    }
    
    return getCurrentCost(service)
  }, [service, editServiceQuantity, editServicePersianDate, editServiceTime, editServiceEndPersianDate, editServiceEndTime, getCurrentCost])

  useEffect(() => {
    if (service) {
      setEditServiceQuantity(service.quantity)
      if (service.startTime) {
        const startDate = new Date(service.startTime)
        const persianDate = convertGregorianToPersian(startDate)
        setEditServicePersianDate(persianDate)
        // Extract time in local timezone format
        const hours = startDate.getHours().toString().padStart(2, '0')
        const minutes = startDate.getMinutes().toString().padStart(2, '0')
        const timeString = `${hours}:${minutes}`
        setEditServiceTime(timeString)
      } else if (service.serviceType === "time-based") {
        // Fallback defaults for time-based services without a startTime
        const now = new Date()
        const persianDate = convertGregorianToPersian(now)
        setEditServicePersianDate(persianDate)
        const hh = now.getHours().toString().padStart(2, '0')
        const mm = now.getMinutes().toString().padStart(2, '0')
        setEditServiceTime(`${hh}:${mm}`)
      }
      
      // Set end time if service has endTime, otherwise leave empty for current time calculation
      if (service.endTime) {
        const endDate = new Date(service.endTime)
        const endPersianDate = convertGregorianToPersian(endDate)
        setEditServiceEndPersianDate(endPersianDate)
        // Extract time in local timezone format
        const endHours = endDate.getHours().toString().padStart(2, '0')
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
        const endTimeString = `${endHours}:${endMinutes}`
        setEditServiceEndTime(endTimeString)
      } else {
        setEditServiceEndPersianDate("")
        setEditServiceEndTime("")
      }
      
      // Calculate initial total cost
      setCalculatedTotalCost(calculateTotalCost())
    }
  }, [service])

  // Update total cost when quantity, date, or time changes
  useEffect(() => {
    if (service) {
      setCalculatedTotalCost(calculateTotalCost())
    }
  }, [calculateTotalCost, service, editServiceQuantity, editServicePersianDate, editServiceTime, editServiceEndPersianDate, editServiceEndTime])

  const handleSave = () => {
    if (!service) return

    // Validate required fields
    if (editServiceQuantity < 1) {
      return
    }

    if (service.serviceType === "time-based") {
      if (!editServicePersianDate || !editServiceTime) {
        return
      }
    }

    onSave(editServiceQuantity, editServicePersianDate, editServiceTime, editServiceEndPersianDate || undefined, editServiceEndTime || undefined)
  }

  // Check if form is valid
  const isFormValid = () => {
    if (!service) return false
    if (editServiceQuantity < 1) return false

    if (service.serviceType === "time-based") {
      if (!editServicePersianDate || !editServiceTime) return false
    }

    return true
  }



  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-2 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ویرایش سرویس</DialogTitle>
          <DialogDescription>
            اطلاعات سرویس را ویرایش کنید
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service-name" className="text-right">
              نام سرویس
            </Label>
            <Input
              id="service-name"
              value={service.serviceName}
              className="col-span-3"
              disabled
            />
          </div>

          {service.serviceType === "unit-based" && (
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="service-quantity" className="text-right">
                تعداد
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="service-quantity"
                  type="number"
                  min="1"
                  value={editServiceQuantity}
                  onChange={(e) => setEditServiceQuantity(parseInt(e.target.value) || 1)}
                />
                {editServiceQuantity < 1 && (
                  <p className="text-xs text-red-600">تعداد باید حداقل ۱ باشد</p>
                )}
              </div>
            </div>
          )}

          {service.serviceType === "time-based" && (
            <>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="service-start-date" className="text-right">
                  تاریخ شروع
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="service-start-date"
                    value={editServicePersianDate}
                    onChange={(e) => {
                      // Only allow English numbers and forward slash
                      const value = e.target.value.replace(/[^0-9/]/g, '')
                      setEditServicePersianDate(value)
                    }}
                    placeholder="1403/01/01"
                    className="w-full"
                    dir="ltr"
                  />
                  {!editServicePersianDate && (
                    <p className="text-xs text-red-600">تاریخ شروع را انتخاب کنید</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="service-start-time" className="text-right">
                  ساعت شروع
                </Label>
                <div className="col-span-3 space-y-1">
                  <CustomTimePicker
                    value={editServiceTime}
                    onChange={setEditServiceTime}
                    placeholder="انتخاب ساعت شروع"
                    className="w-full"
                  />
                  {!editServiceTime && (
                    <p className="text-xs text-red-600">ساعت شروع را وارد کنید</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="service-end-date" className="text-right">
                  تاریخ پایان
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="service-end-date"
                    value={editServiceEndPersianDate}
                    onChange={(e) => {
                      // Only allow English numbers and forward slash
                      const value = e.target.value.replace(/[^0-9/]/g, '')
                      setEditServiceEndPersianDate(value)
                    }}
                    placeholder="1403/01/01 (اختیاری)"
                    className="w-full"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">اگر خالی باشد، زمان فعلی استفاده می‌شود</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="service-end-time" className="text-right">
                  ساعت پایان
                </Label>
                <div className="col-span-3 space-y-1">
                  <CustomTimePicker
                    value={editServiceEndTime}
                    onChange={setEditServiceEndTime}
                    placeholder="انتخاب ساعت پایان (اختیاری)"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">اگر خالی باشد، زمان فعلی استفاده می‌شود</p>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              قیمت واحد
            </Label>
            <span className="col-span-3 text-sm text-gray-600">
              {formatPrice(service.price)}
            </span>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              قیمت کل
            </Label>
            <span className="col-span-3 font-medium">
              {formatPrice(calculatedTotalCost)}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid()}>
            ذخیره تغییرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}