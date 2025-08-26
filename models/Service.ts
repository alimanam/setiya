import mongoose from "mongoose"

export interface IService {
  _id?: string
  name: string
  type: "time-based" | "unit-based"
  price: number
  description?: string
  category: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const ServiceSchema = new mongoose.Schema<IService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["time-based", "unit-based"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema)
