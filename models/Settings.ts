import mongoose from 'mongoose'

interface ISettings {
  key: string
  value: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const settingsSchema = new mongoose.Schema<ISettings>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema)

export default Settings
export type { ISettings }