import { config } from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

// Load environment variables
config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables')
  process.exit(1)
}

async function findOrCreateAdminUser() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const operatorsCollection = db.collection('operators')
    
    // First, try to find an existing admin user
    const existingAdmin = await operatorsCollection.findOne({ role: 'admin' })
    
    if (existingAdmin) {
      console.log('Found existing admin user:')
      console.log(`ID: ${existingAdmin._id}`)
      console.log(`Username: ${existingAdmin.username}`)
      console.log(`Email: ${existingAdmin.email}`)
      console.log(`Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`)
      return existingAdmin._id.toString()
    }
    
    // If no admin exists, create one
    console.log('No admin user found. Creating default admin user...')
    
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@setiagaming.com',
      firstName: 'مدیر',
      lastName: 'سیستم',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await operatorsCollection.insertOne(adminUser)
    
    console.log('Admin user created successfully:')
    console.log(`ID: ${result.insertedId}`)
    console.log(`Username: admin`)
    console.log(`Password: admin123`)
    console.log(`Email: admin@setiagaming.com`)
    
    return result.insertedId.toString()
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

findOrCreateAdminUser().then(adminId => {
  console.log(`\nAdmin User ID: ${adminId}`)
  process.exit(0)
})