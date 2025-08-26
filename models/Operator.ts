import mongoose from "mongoose"

export interface IOperator {
  _id?: string
  username: string
  password: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "operator"
  createdAt?: Date
  updatedAt?: Date
}

const OperatorSchema = new mongoose.Schema<IOperator>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
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
    role: {
      type: String,
      required: true,
      enum: ["admin", "operator"],
      default: "operator",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Operator || mongoose.model<IOperator>("Operator", OperatorSchema)