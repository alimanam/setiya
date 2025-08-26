// Shared backup progress storage
// In production, this should be stored in Redis or database
export const backupProgress = new Map<string, {
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  progress: number
  currentCollection?: string
  processedRecords: number
  totalRecords: number
  collections: string[]
  startTime: Date
  endTime?: Date
  error?: string
  downloadUrl?: string
}>()