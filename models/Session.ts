import mongoose from "mongoose"

export interface ISessionService {
  serviceId: string
  serviceName: string
  serviceType: "time-based" | "unit-based"
  price: number
  quantity: number
  startTime?: Date
  endTime?: Date
  duration?: number
  totalCost: number
  isPaused?: boolean
  pausedTime?: Date
  totalPausedDuration?: number
}

export interface ISession {
  _id?: string
  customerId: string
  customerName: string
  customerPhone: string
  operatorId?: string
  startTime: Date
  endTime?: Date
  status: "active" | "paused" | "completed"
  services: ISessionService[]
  totalCost: number
  notes?: string
  completedByOperator?: string
}

const SessionServiceSchema = new mongoose.Schema<ISessionService>({
  serviceId: {
    type: String,
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
    enum: ["time-based", "unit-based"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  startTime: Date,
  endTime: Date,
  duration: {
    type: Number,
    min: 0,
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  pausedTime: Date,
  totalPausedDuration: {
    type: Number,
    min: 0,
    default: 0,
  },
})

const SessionSchema = new mongoose.Schema<ISession>(
  {
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    operatorId: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    status: {
      type: String,
      required: true,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
    services: [SessionServiceSchema],
    totalCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    completedByOperator: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema)
