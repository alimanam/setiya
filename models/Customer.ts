import mongoose from "mongoose"

export interface ICustomer {
  _id?: string
  firstName: string
  lastName: string
  phone: string
  registrationDate: Date
}

const CustomerSchema = new mongoose.Schema<ICustomer>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema)
