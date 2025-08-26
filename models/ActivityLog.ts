import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityLog extends Document {
  operatorId: string
  operatorUsername: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  status: 'success' | 'failed'
  expiresAt?: Date
}

export interface IActivityLogModel extends mongoose.Model<IActivityLog> {
  updateTTLFromSettings(): Promise<void>
}

const ActivityLogSchema: Schema = new Schema({
  operatorId: {
    type: String,
    required: true,
    index: true
  },
  operatorUsername: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create',
      'update',
      'delete',
      'view',
      'start_session',
      'end_session',
      'pause_session',
      'resume_session',
      'add_service',
      'edit_service',
      'remove_service'
    ],
    index: true
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'auth',
      'customer',
      'service',
      'session',
      'category',
      'operator',
      'settings',
      'backup'
    ],
    index: true
  },
  resourceId: {
    type: String,
    index: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
    index: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
}, {
  timestamps: true
})

// Create compound indexes for better query performance
ActivityLogSchema.index({ operatorId: 1, timestamp: -1 })
ActivityLogSchema.index({ action: 1, timestamp: -1 })
ActivityLogSchema.index({ resource: 1, timestamp: -1 })
ActivityLogSchema.index({ timestamp: -1 })

// Set default expiration time (6 months from creation)
ActivityLogSchema.pre('save', async function(next) {
  if (this.isNew && !this.expiresAt) {
    // Default to 6 months (180 days)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setDate(sixMonthsFromNow.getDate() + 180)
    this.expiresAt = sixMonthsFromNow
  }
  next()
})

// Static method to update TTL for existing logs based on settings
ActivityLogSchema.statics.updateTTLFromSettings = async function() {
  try {
    const Settings = mongoose.models.Settings
    if (!Settings) return
    
    const retentionSetting = await Settings.findOne({ key: 'log_retention_days' })
    const retentionDays = retentionSetting ? parseInt(retentionSetting.value) : 180
    
    if (retentionDays > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + retentionDays)
      
      // Update logs that don't have expiration or have different expiration
      await this.updateMany(
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null }
          ]
        },
        { expiresAt: cutoffDate }
      )
    }
  } catch (error) {
    console.error('Error updating TTL from settings:', error)
  }
}

export default (mongoose.models.ActivityLog as IActivityLogModel) || mongoose.model<IActivityLog, IActivityLogModel>('ActivityLog', ActivityLogSchema)