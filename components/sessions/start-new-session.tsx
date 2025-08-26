'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ModernSelect } from "@/components/ui/modern-select"
import { UserPlus, Play, Sparkles, Users } from "lucide-react"
import { Customer } from "./types"

interface StartNewSessionProps {
  customers: Customer[]
  selectedCustomer: string
  onCustomerChange: (customerId: string) => void
  onStartSession: () => void
}

export function StartNewSession({
  customers,
  selectedCustomer,
  onCustomerChange,
  onStartSession
}: StartNewSessionProps) {
  return (
    <div className="mb-8">
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full translate-y-12 -translate-x-12" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  شروع جلسه جدید
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  مشتری را انتخاب کنید و تجربه‌ای فوق‌العاده آغاز کنید
                </CardDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{customers.length} مشتری</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative pt-2">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            <div className="flex-1 space-y-3">
              <Label htmlFor="customer-select" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                انتخاب مشتری
              </Label>
              <div className="relative">
                <ModernSelect
                  options={customers.map(customer => ({
                    value: customer._id,
                    label: `${customer.firstName} ${customer.lastName}`,
                    searchText: [customer.firstName, customer.lastName, customer.phone].filter(Boolean).join(' '),
                  }))}
                  value={selectedCustomer}
                  onValueChange={onCustomerChange}
                  placeholder="مشتری را انتخاب کنید"
                  className="w-full h-12 bg-white/80 backdrop-blur-sm border-white/50 shadow-sm hover:shadow-md transition-all duration-200"
                />
              </div>
            </div>
            
            <Button
              onClick={onStartSession}
              disabled={!selectedCustomer}
              size="lg"
              className={`h-12 px-8 font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedCustomer
                  ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl border-0"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none hover:scale-100"
              }`}
            >
              <Play className="h-5 w-5 mr-2" />
              شروع جلسه
              {selectedCustomer && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-md opacity-0 hover:opacity-100 transition-opacity duration-300" />
              )}
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-white/30">
            <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>آماده برای شروع</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>سیستم آنلاین</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}