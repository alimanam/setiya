export interface Customer {
  _id: string
  id?: string
  firstName: string
  lastName: string
  phone: string
}

export interface Service {
  _id: string
  id?: string
  name: string
  type: "time-based" | "unit-based"
  price: number
  category: string
  isActive: boolean
}

export interface SessionService {
  id?: string
  _id?: string
  serviceId: string
  serviceName: string
  serviceType: "time-based" | "unit-based"
  price: number
  quantity: number
  startTime?: Date
  endTime?: Date
  duration?: number // in minutes
  totalCost: number
  isPaused?: boolean
  pausedTime?: Date
  totalPausedDuration?: number // in minutes
}

export interface Session {
  _id: string
  id?: string
  customerId: string
  customerName: string
  customerPhone: string
  startTime: Date
  endTime?: Date
  status: "active" | "paused" | "completed"
  services: SessionService[]
  totalCost: number
  notes: string
  completedByOperator?: string
  completedSessionId?: string | number
}