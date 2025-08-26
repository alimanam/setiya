import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { verifyTokenFromRequest } from '@/lib/jwt-edge'
import { logActivity, LOG_ACTIONS, LOG_RESOURCES } from '@/lib/activity-logger'
import ActivityLog from '@/models/ActivityLog'
import Customer from '@/models/Customer'
import Operator from '@/models/Operator'
import Service from '@/models/Service'
import Category from '@/models/Category'
import Session from '@/models/Session'
import Settings from '@/models/Settings'
import PasswordReset from '@/models/PasswordReset'
import UserSession from '@/models/UserSession'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

// Import shared backupProgress map
import { backupProgress } from '../shared'

// Helper function to convert MongoDB documents to Extended JSON format
function convertToExtendedJSON(data: any[]): any[] {
  return data.map(doc => {
    const converted: any = {}
    
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id' && value) {
        converted._id = { $oid: value.toString() }
      } else if (key === 'createdAt' || key === 'updatedAt') {
        if (value instanceof Date) {
          converted[key] = { $date: value.toISOString() }
        } else if (typeof value === 'string') {
          converted[key] = { $date: value }
        } else {
          converted[key] = value
        }
      } else {
        converted[key] = value
      }
    }
    
    return converted
  })
}

const collections = [
  { name: 'customers', model: Customer, label: 'مشتریان' },
  { name: 'operators', model: Operator, label: 'اپراتورها' },
  { name: 'services', model: Service, label: 'سرویس‌ها' },
  { name: 'categories', model: Category, label: 'دسته‌بندی‌ها' },
  { name: 'sessions', model: Session, label: 'جلسات' },
  { name: 'settings', model: Settings, label: 'تنظیمات' },
  { name: 'activityLogs', model: ActivityLog, label: 'لاگ‌های فعالیت' },
  { name: 'passwordResets', model: PasswordReset, label: 'بازنشانی رمز عبور' },
  { name: 'userSessions', model: UserSession, label: 'جلسات کاربری' }
]

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const tokenResult = await verifyTokenFromRequest(request)
    if (!tokenResult || tokenResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Get selected collections from request body
    const body = await request.json()
    const { selectedCollections } = body

    // Validate selected collections
    if (!selectedCollections || !Array.isArray(selectedCollections) || selectedCollections.length === 0) {
      return NextResponse.json(
        { error: 'لطفاً حداقل یک کالکشن انتخاب کنید' },
        { status: 400 }
      )
    }

    // Filter collections based on selection
    const collectionsToBackup = collections.filter(c => selectedCollections.includes(c.name))
    
    if (collectionsToBackup.length === 0) {
      return NextResponse.json(
        { error: 'کالکشن‌های انتخابی معتبر نیستند' },
        { status: 400 }
      )
    }

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Initialize backup progress
    backupProgress.set(backupId, {
      status: 'in_progress',
      progress: 0,
      currentCollection: '',
      processedRecords: 0,
      totalRecords: 0,
      collections: collectionsToBackup.map(c => c.name),
      startTime: new Date()
    })

    // Start backup process asynchronously
    performBackup(backupId, tokenResult.userId, tokenResult.username, collectionsToBackup)

    // Log backup start
    await logActivity({
      operatorId: tokenResult.userId,
      operatorUsername: tokenResult.username,
      action: LOG_ACTIONS.CREATE,
      resource: LOG_RESOURCES.BACKUP,
      resourceId: 'backup',
      details: {
        action: 'شروع بک‌آپ سیستم',
        backupId,
        timestamp: new Date().toISOString()
      },
      status: 'success',
      request
    })

    return NextResponse.json({
      success: true,
      backupId,
      message: 'فرآیند بک‌آپ شروع شد'
    })

  } catch (error: any) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { error: 'خطا در شروع فرآیند بک‌آپ' },
      { status: 500 }
    )
  }
}

// Helper function to create ZIP file
async function createZipFile(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    output.on('close', () => {
      console.log(`ZIP file created: ${archive.pointer()} total bytes`)
      resolve()
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

async function performBackup(backupId: string, operatorId: string, operatorUsername: string, collectionsToBackup: any[]) {
  const progress = backupProgress.get(backupId)
  if (!progress) return

  try {
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'temp', 'backups', backupId)
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    let totalRecords = 0
    let processedRecords = 0

    // First pass: count total records
    for (const collection of collectionsToBackup) {
      const count = await collection.model.estimatedDocumentCount()
      totalRecords += count
    }

    progress.totalRecords = totalRecords
    backupProgress.set(backupId, progress)

    // Create metadata file
    const metadata = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: operatorUsername,
      totalCollections: collectionsToBackup.length,
      collections: collectionsToBackup.map(c => ({ name: c.name, label: c.label }))
    }
    
    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )

    // Second pass: export data for each collection in separate files
    for (let i = 0; i < collectionsToBackup.length; i++) {
      const collection = collectionsToBackup[i]
      progress.currentCollection = collection.label
      progress.progress = Math.round((i / collectionsToBackup.length) * 80) // Reserve 20% for zipping
      backupProgress.set(backupId, progress)

      try {
        const data = await (collection.model as any).find({}).lean().exec()
        
        // Convert to Extended JSON format
        const extendedJSONData = convertToExtendedJSON(data)
        
        // Save each collection to separate file in Extended JSON format
        const collectionFilePath = path.join(backupDir, `${collection.name}.json`)
        fs.writeFileSync(collectionFilePath, JSON.stringify(extendedJSONData, null, 2))
        
        processedRecords += data.length
        progress.processedRecords = processedRecords
        backupProgress.set(backupId, progress)

        // Small delay to allow progress updates
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (collectionError) {
        console.error(`Error backing up ${collection.name}:`, collectionError)
        
        // Save empty array in Extended JSON format for failed collections
        const collectionFilePath = path.join(backupDir, `${collection.name}.json`)
        fs.writeFileSync(collectionFilePath, JSON.stringify([], null, 2))
      }
    }

    // Update progress for zipping
    progress.currentCollection = 'ایجاد فایل زیپ...'
    progress.progress = 85
    backupProgress.set(backupId, progress)

    // Create ZIP file
    const zipFilePath = path.join(process.cwd(), 'temp', 'backups', `${backupId}.zip`)
    await createZipFile(backupDir, zipFilePath)

    // Clean up individual files (keep only ZIP)
    fs.rmSync(backupDir, { recursive: true, force: true })

    // Complete backup
    progress.status = 'completed'
    progress.progress = 100
    progress.currentCollection = 'تکمیل شد'
    progress.endTime = new Date()
    progress.downloadUrl = `/api/admin/backup/download?backupId=${backupId}`
    backupProgress.set(backupId, progress)

    // Log successful backup
    await logActivity({
      operatorId,
      operatorUsername,
      action: LOG_ACTIONS.CREATE,
      resource: LOG_RESOURCES.BACKUP,
      resourceId: 'backup',
      details: {
        action: 'تکمیل بک‌آپ سیستم',
        backupId,
        totalRecords: processedRecords,
        duration: progress.endTime.getTime() - progress.startTime.getTime(),
        timestamp: new Date().toISOString()
      },
      status: 'success'
    })

  } catch (error: any) {
    console.error('Backup process error:', error)
    progress.status = 'error'
    progress.error = error.message
    progress.endTime = new Date()
    backupProgress.set(backupId, progress)

    // Log failed backup
    await logActivity({
      operatorId,
      operatorUsername,
      action: LOG_ACTIONS.CREATE,
      resource: LOG_RESOURCES.BACKUP,
      resourceId: 'backup',
      details: {
        action: 'خطا در بک‌آپ سیستم',
        backupId,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      status: 'failed'
    })
  }
}

// Export progress map for use in progress endpoint