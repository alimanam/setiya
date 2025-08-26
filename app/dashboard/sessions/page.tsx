'use client'

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Activity, Clock, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useSessions,
  SessionCard,
  CompletedSessionsTable,
  EditServiceDialog,
  SessionDetailsDialog,
  StartNewSession,
  ActiveCustomersDisplay,
  AddCustomerDialog,
  formatDuration,
  formatPrice,
  getCurrentCost,
  getCurrentDuration,
  getSessionDuration,
  getSessionCurrentCost,
  getSessionCurrentDuration,
  getTimeBasedServicesDurationHHMM,
  convertGregorianToPersian
} from "@/components/sessions"

export default function SessionsPage() {
  const router = useRouter()
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false)
  
  const {
    customers,
    availableCustomers,
    services,
    selectedCustomer,
    message,
    messageType,
    activeSessions,
    completedSessions,
    showEditServiceDialog,
    editingService,
    showSessionDetailsDialog,
    selectedSessionForDetails,
    setSelectedCustomer,
    setMessage,
    setMessageType,
    setShowEditServiceDialog,
    setShowSessionDetailsDialog,
    setSelectedSessionForDetails,
    startSession,
    addServiceToSession,
    removeServiceFromSession,
    toggleServiceStatus,
    editServiceInSession,
    openEditServiceDialog,
    endSession,
    cancelSession,
    refreshCustomers,
  } = useSessions()

  // Clear message after 5 seconds
  const clearMessage = () => {
    setTimeout(() => {
      setMessage("")
    }, 5000)
  }

  // Clear message when it's set
  if (message) {
    clearMessage()
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به داشبورد
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">مدیریت جلسات</h1>
              </div>
              <Button 
                onClick={() => setShowAddCustomerDialog(true)} 
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                مشتری جدید
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Message Alert */}
          {message && (
            <Alert
              className={`mb-6 ${
                messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
              }`}
            >
              <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Start New Session */}
          <StartNewSession
            customers={availableCustomers}
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onStartSession={startSession}
          />

          {/* Sessions Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-100 to-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300 rounded-lg font-semibold text-gray-600 hover:text-gray-800"
              >
                <Activity className="h-4 w-4 mr-2" />
                جلسات فعال
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all duration-300 rounded-lg font-semibold text-gray-600 hover:text-gray-800"
              >
                <Clock className="h-4 w-4 mr-2" />
                جلسات تمام شده
              </TabsTrigger>
            </TabsList>

            {/* Active Sessions Tab */}
            <TabsContent value="active">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-sm font-bold text-white">جلسات فعال</CardTitle>
                      <CardDescription className="text-xs text-white font-bold">جلسات در حال انجام ({activeSessions.length} جلسه)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ActiveCustomersDisplay
                    activeSessions={activeSessions}
                    services={services}
                    onAddService={addServiceToSession}
                    onRemoveService={removeServiceFromSession}
                    onToggleService={toggleServiceStatus}
                    onEditService={openEditServiceDialog}
                    onEndSession={endSession}
                    onCancelSession={cancelSession}
                    formatDuration={formatDuration}
                    formatPrice={formatPrice}
                    getCurrentCost={getSessionCurrentCost}
                    getCurrentDuration={getSessionCurrentDuration}
                    getSessionDuration={getSessionDuration}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Sessions Tab */}
            <TabsContent value="completed">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">جلسات تمام شده</CardTitle>
                      <CardDescription className="text-emerald-100">تاریخچه جلسات ({completedSessions.length} جلسه)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CompletedSessionsTable
                    sessions={completedSessions}
                    onViewDetails={(session) => {
                      setSelectedSessionForDetails(session)
                      setShowSessionDetailsDialog(true)
                    }}
                    formatDuration={formatDuration}
                    formatPrice={formatPrice}
                    getSessionDuration={getSessionDuration}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Edit Service Dialog */}
        <EditServiceDialog
          open={showEditServiceDialog}
          onOpenChange={setShowEditServiceDialog}
          service={editingService}
          onSave={editServiceInSession}
          formatPrice={formatPrice}
          convertGregorianToPersian={convertGregorianToPersian}
          getCurrentCost={getCurrentCost}
        />

        {/* Session Details Dialog */}
        <SessionDetailsDialog
          open={showSessionDetailsDialog}
          onOpenChange={(open) => {
            setShowSessionDetailsDialog(open)
            if (!open) setSelectedSessionForDetails(null)
          }}
          session={selectedSessionForDetails}
          formatPrice={formatPrice}
        />

        {/* Add Customer Dialog */}
        <AddCustomerDialog
          open={showAddCustomerDialog}
          onOpenChange={setShowAddCustomerDialog}
          onCustomerAdded={refreshCustomers}
        />
      </div>
    </AuthGuard>
  )
}