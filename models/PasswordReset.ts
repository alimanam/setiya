import mongoose, { Document, Schema } from 'mongoose'

export interface IPasswordReset extends Document {
  email: string
  token: string
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
}

const PasswordResetSchema = new Schema<IPasswordReset>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for faster lookups
PasswordResetSchema.index({ email: 1, token: 1 })
PasswordResetSchema.index({ token: 1 })

// Static method to clean up expired tokens
PasswordResetSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  })
}

// Static method to invalidate all tokens for an email
PasswordResetSchema.statics.invalidateUserTokens = async function(email: string) {
  return this.updateMany(
    { email: email.toLowerCase(), isUsed: false },
    { isUsed: true }
  )
}

const PasswordReset = mongoose.models.PasswordReset || mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema)

export default PasswordReset