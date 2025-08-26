'use client'

import { useState, useEffect, useMemo } from "react"
import { Session, Customer, Service, SessionService } from "./types"
import { getCurrentCost, getCurrentDuration, convertPersianToGregorian } from "./utils"

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")


  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Dialog states
  const [showEditServiceDialog, setShowEditServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<SessionService | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [showSessionDetailsDialog, setShowSessionDetailsDialog] = useState(false)
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<Session | null>(null)

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sessions
        const sessionsResponse = await fetch("/api/sessions")
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          const formattedSessions = sessionsData.map((session: any) => ({
            ...session,
            _id: session._id || session.id,
            id: session._id || session.id,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
            services: session.services.map((service: any) => ({
              ...service,
              startTime: service.startTime ? new Date(service.startTime) : undefined,
              endTime: service.endTime ? new Date(service.endTime) : undefined,
              pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
            }))
          }))
          setSessions(formattedSessions)
        }

        // Fetch customers
        const customersResponse = await fetch("/api/customers")
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          const customersArray = Array.isArray(customersData) ? customersData : customersData.customers || []
          setCustomers(customersArray)
        }

        // Fetch services
        const servicesResponse = await fetch("/api/services")
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          setServices(servicesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const saveSessions = async (updatedSessions: Session[]) => {
    // This would typically save to API
    setSessions(updatedSessions)
  }

  const refreshCustomers = async () => {
    try {
      const customersResponse = await fetch("/api/customers")
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        const customersArray = Array.isArray(customersData) ? customersData : customersData.customers || []
        setCustomers(customersArray)
      }
    } catch (error) {
      console.error("Error refreshing customers:", error)
    }
  }

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Note: Using stored database values for totalCost instead of real-time calculations
  // Real-time calculations are handled by the backend APIs

  const toggleServiceStatus = async (sessionId: string, serviceId: string, action: "pause" | "resume") => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/services/${serviceId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const formattedSession = {
          ...updatedSession,
          id: updatedSession._id || updatedSession.id,
          startTime: new Date(updatedSession.startTime),
          endTime: updatedSession.endTime ? new Date(updatedSession.endTime) : undefined,
          services: updatedSession.services.map((service: any) => ({
            ...service,
            startTime: service.startTime ? new Date(service.startTime) : undefined,
            endTime: service.endTime ? new Date(service.endTime) : undefined,
            pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
          }))
        }

        setSessions(prev => prev.map(s => (s._id === sessionId || s.id === sessionId) ? formattedSession : s))
        setMessage(`سرویس با موفقیت ${action === "pause" ? "متوقف" : "ادامه یافت"}`)
        setMessageType("success")
      }
    } catch (error) {
      setMessage("خطا در تغییر وضعیت سرویس")
      setMessageType("error")
    }
  }

  const startSession = async () => {
    if (!selectedCustomer) {
      setMessage("لطفا مشتری را انتخاب کنید")
      setMessageType("error")
      return
    }

    const customer = customers.find(c => c._id === selectedCustomer)
    if (!customer) {
      setMessage("مشتری یافت نشد")
      setMessageType("error")
      return
    }

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerPhone: customer.phone,
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        const formattedSession = {
          ...newSession,
          id: newSession._id || newSession.id,
          startTime: new Date(newSession.startTime),
          endTime: newSession.endTime ? new Date(newSession.endTime) : undefined,
          services: []
        }
        setSessions(prev => [formattedSession, ...prev])
        setSelectedCustomer("")
        setMessage("جلسه با موفقیت شروع شد")
        setMessageType("success")
      } else {
        setMessage("خطا در شروع جلسه")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در شروع جلسه")
      setMessageType("error")
    }
  }

  const addServiceToSession = async (sessionId: string, serviceId: string, quantity: number) => {
    console.log('addServiceToSession called with:', { sessionId, serviceId, quantity })
    const service = services.find(s => s._id === serviceId)
    if (!service) {
      console.log('Service not found:', serviceId)
      setMessage("سرویس یافت نشد")
      setMessageType("error")
      return
    }

    try {
      console.log('Making API request to:', `/api/sessions/${sessionId}/services`)
      const response = await fetch(`/api/sessions/${sessionId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          quantity,
        }),
      })

      console.log('API response status:', response.status)
      if (response.ok) {
        const updatedSession = await response.json()
        console.log('Updated session from API:', updatedSession)
        const formattedSession = {
          ...updatedSession,
          id: updatedSession._id || updatedSession.id,
          startTime: new Date(updatedSession.startTime),
          endTime: updatedSession.endTime ? new Date(updatedSession.endTime) : undefined,
          services: updatedSession.services.map((service: any) => ({
            ...service,
            startTime: service.startTime ? new Date(service.startTime) : undefined,
            endTime: service.endTime ? new Date(service.endTime) : undefined,
            pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
          }))
        }

        setSessions(prev => prev.map(s => (s._id === sessionId || s.id === sessionId) ? formattedSession : s))
        setMessage("سرویس با موفقیت اضافه شد")
        setMessageType("success")
      } else {
        const errorData = await response.json()
        console.log('API error response:', errorData)
        setMessage("خطا در افزودن سرویس")
        setMessageType("error")
      }
    } catch (error) {
      console.error('Error in addServiceToSession:', error)
      setMessage("خطا در افزودن سرویس")
      setMessageType("error")
    }
  }

  const removeServiceFromSession = async (sessionId: string, serviceId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/services/${serviceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const formattedSession = {
          ...updatedSession,
          id: updatedSession._id || updatedSession.id,
          startTime: new Date(updatedSession.startTime),
          endTime: updatedSession.endTime ? new Date(updatedSession.endTime) : undefined,
          services: updatedSession.services.map((service: any) => ({
            ...service,
            startTime: service.startTime ? new Date(service.startTime) : undefined,
            endTime: service.endTime ? new Date(service.endTime) : undefined,
            pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
          }))
        }

        setSessions(prev => prev.map(s => (s._id === sessionId || s.id === sessionId) ? formattedSession : s))
        setMessage("سرویس با موفقیت حذف شد")
        setMessageType("success")
      } else {
        setMessage("خطا در حذف سرویس")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در حذف سرویس")
      setMessageType("error")
    }
  }

  const editServiceInSession = async (quantity: number, persianDate: string, time: string, endPersianDate?: string, endTime?: string) => {
    if (!editingService) return

    try {
      // Use the stored sessionId to avoid picking a wrong session with the same serviceId
      const targetSession = editingSessionId
        ? sessions.find(s => (s._id || s.id) === editingSessionId)
        : sessions.find(s => s.services.some(service => service.serviceId === editingService.serviceId))
      if (!targetSession) return

      let updateData: any = {}

      if (editingService.serviceType === "unit-based") {
        updateData.quantity = quantity
      } else if (editingService.serviceType === "time-based" && persianDate && time) {
        const newStartTime = convertPersianToGregorian(persianDate, time)
        updateData.startTime = newStartTime.toISOString()
        
        // Add endTime if provided
        if (endPersianDate && endTime) {
          const newEndTime = convertPersianToGregorian(endPersianDate, endTime)
          updateData.endTime = newEndTime.toISOString()
        } else if (endPersianDate === "" && endTime === "") {
          // Explicitly clear endTime if empty strings are provided
          updateData.endTime = null
        }
      }

      const sessionIdForApi = targetSession._id || targetSession.id

      const response = await fetch(`/api/sessions/${sessionIdForApi}/services/${editingService.serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const formattedSession = {
          ...updatedSession,
          id: updatedSession._id || updatedSession.id,
          startTime: new Date(updatedSession.startTime),
          endTime: updatedSession.endTime ? new Date(updatedSession.endTime) : undefined,
          services: updatedSession.services.map((service: any) => ({
            ...service,
            startTime: service.startTime ? new Date(service.startTime) : undefined,
            endTime: service.endTime ? new Date(service.endTime) : undefined,
            pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
          }))
        }

        setSessions(prev => prev.map(s => ((s._id || s.id) === (sessionIdForApi)) ? formattedSession : s))
        setShowEditServiceDialog(false)
        setEditingService(null)
        setEditingSessionId(null)
        setMessage("سرویس با موفقیت ویرایش شد")
        setMessageType("success")
      } else {
        setMessage("خطا در ویرایش سرویس")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در ویرایش سرویس")
      setMessageType("error")
    }
  }

  const openEditServiceDialog = (sessionId: string, service: SessionService) => {
    setEditingService(service)
    setEditingSessionId(sessionId)
    setShowEditServiceDialog(true)
  }

  const endSession = async (sessionId: string) => {
    try {
      // Get operator info from localStorage
      const operatorData = localStorage.getItem('operator')
      const operator = operatorData ? JSON.parse(operatorData) : null
      const operatorUsername = operator?.username || operator?.name || 'نامشخص'

      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operatorUsername
        })
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const formattedSession = {
          ...updatedSession,
          id: updatedSession._id || updatedSession.id,
          startTime: new Date(updatedSession.startTime),
          endTime: updatedSession.endTime ? new Date(updatedSession.endTime) : undefined,
          services: updatedSession.services.map((service: any) => ({
            ...service,
            startTime: service.startTime ? new Date(service.startTime) : undefined,
            endTime: service.endTime ? new Date(service.endTime) : undefined,
            pausedTime: service.pausedTime ? new Date(service.pausedTime) : undefined,
          }))
        }

        setSessions(prev => prev.map(s => (s._id === sessionId || s.id === sessionId) ? formattedSession : s))
        setMessage("جلسه با موفقیت پایان یافت")
        setMessageType("success")
      } else {
        setMessage("خطا در پایان جلسه")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در پایان جلسه")
      setMessageType("error")
    }
  }

  const cancelSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => (s._id !== sessionId && s.id !== sessionId)))
        setMessage("جلسه با موفقیت لغو و حذف شد")
        setMessageType("success")
      } else {
        setMessage("خطا در لغو جلسه")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("خطا در لغو جلسه")
      setMessageType("error")
    }
  }




  const activeSessions = useMemo(() => {
    return sessions.filter(session => session.status === "active" || session.status === "paused")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [sessions])

  const completedSessions = useMemo(() => {
    return sessions.filter(session => session.status === "completed")
      .sort((a, b) => {
        const aEndTime = a.endTime ? new Date(a.endTime).getTime() : 0
        const bEndTime = b.endTime ? new Date(b.endTime).getTime() : 0
        return bEndTime - aEndTime
      })
  }, [sessions])

  // Filter customers who are not currently in active sessions
  const availableCustomers = useMemo(() => {
    const activeCustomerIds = activeSessions.map(session => session.customerId)
    return customers.filter(customer => !activeCustomerIds.includes(customer._id))
  }, [customers, activeSessions])

  return {
    // State
    sessions,
    customers,
    availableCustomers,
    services,
    selectedCustomer,
    message,
    messageType,
    activeSessions,
    completedSessions,

    // Dialog states
    showEditServiceDialog,
    editingService,
    showSessionDetailsDialog,
    selectedSessionForDetails,

    // Actions
    setSelectedCustomer,
    setMessage,
    setMessageType,
    setShowEditServiceDialog,
    setEditingService,
    setShowSessionDetailsDialog,
    setSelectedSessionForDetails,

    // Functions
    startSession,
    addServiceToSession,
    removeServiceFromSession,
    toggleServiceStatus,
    editServiceInSession,
    openEditServiceDialog,
    endSession,
    cancelSession,
    refreshCustomers,
  }
}