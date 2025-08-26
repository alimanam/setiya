import mongoose from 'mongoose'

interface IUserSession {
  userId: mongoose.Types.ObjectId
  token: string
  userAgent?: string
  ipAddress?: string
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  lastAccessedAt: Date
}

const userSessionSchema = new mongoose.Schema<IUserSession>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for efficient queries
userSessionSchema.index({ userId: 1, isActive: 1 })
userSessionSchema.index({ token: 1, isActive: 1 })

// Clean up expired sessions
userSessionSchema.statics.cleanupExpiredSessions = async function() {
  const now = new Date()
  await this.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { isActive: false }
    ]
  })
}

// Deactivate all sessions for a user
userSessionSchema.statics.deactivateUserSessions = async function(userId: string) {
  await this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  )
}

const UserSession = mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', userSessionSchema)

export default UserSession