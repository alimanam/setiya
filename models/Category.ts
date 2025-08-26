import mongoose from "mongoose"

interface ICategory {
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "نام دسته‌بندی الزامی است"],
      unique: true,
      trim: true,
      maxlength: [50, "نام دسته‌بندی نمی‌تواند بیش از 50 کاراکتر باشد"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "توضیحات نمی‌تواند بیش از 200 کاراکتر باشد"],
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

// Create index for better performance
categorySchema.index({ name: 1 })
categorySchema.index({ isActive: 1 })

const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema)

export default Category
export type { ICategory }