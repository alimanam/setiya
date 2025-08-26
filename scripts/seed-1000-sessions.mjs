import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Define schemas directly
const SessionServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  serviceType: { type: String, required: true, enum: ["time-based", "unit-based"] },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  startTime: Date,
  endTime: Date,
  duration: { type: Number, min: 0 },
  totalCost: { type: Number, required: true, min: 0, default: 0 },
  isPaused: { type: Boolean, default: false },
  pausedTime: Date,
  totalPausedDuration: { type: Number, min: 0, default: 0 }
})

const SessionSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  operatorId: { type: String },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: Date,
  status: { type: String, required: true, enum: ["active", "paused", "completed"], default: "active" },
  services: [SessionServiceSchema],
  totalCost: { type: Number, required: true, min: 0, default: 0 },
  notes: { type: String, trim: true },
  completedByOperator: { type: String, trim: true }
}, { timestamps: true })

const CustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true })

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ["time-based", "unit-based"] },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const OperatorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ["admin", "operator"], default: "operator" }
}, { timestamps: true })

// Create models
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema)
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema)
const Operator = mongoose.models.Operator || mongoose.model('Operator', OperatorSchema)

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Generate random date between now and 1 year ago
function getRandomDate() {
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const randomTime = oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
  return new Date(randomTime)
}

// Generate random session duration (15 minutes to 8 hours)
function getRandomDuration() {
  return Math.floor(Math.random() * (480 - 15) + 15) // 15 to 480 minutes
}

// Generate random service quantity for unit-based services
function getRandomQuantity() {
  return Math.floor(Math.random() * 5) + 1 // 1 to 5 items
}

// Get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Generate random services for a session (1-3 services)
function generateRandomServices(services) {
  const numServices = Math.floor(Math.random() * 3) + 1 // 1 to 3 services
  const selectedServices = []
  const usedServiceIds = new Set()
  
  for (let i = 0; i < numServices; i++) {
    let service
    do {
      service = getRandomElement(services)
    } while (usedServiceIds.has(service._id.toString()))
    
    usedServiceIds.add(service._id.toString())
    
    const sessionService = {
      serviceId: service._id.toString(),
      serviceName: service.name,
      serviceType: service.type,
      price: service.price,
      quantity: service.type === 'unit-based' ? getRandomQuantity() : 1,
      totalCost: 0,
      isPaused: false,
      totalPausedDuration: 0
    }
    
    if (service.type === 'time-based') {
      const duration = getRandomDuration()
      sessionService.duration = duration
      sessionService.totalCost = Math.round((duration / 60) * service.price)
    } else {
      sessionService.totalCost = sessionService.quantity * service.price
    }
    
    selectedServices.push(sessionService)
  }
  
  return selectedServices
}

async function createTestSessions() {
  try {
    console.log('🔍 Fetching existing data...')
    
    // Get all customers
    const customers = await Customer.find({})
    if (customers.length === 0) {
      console.error('❌ No customers found. Please run seed-sample-data.js first')
      return
    }
    console.log(`✅ Found ${customers.length} customers`)
    
    // Get all active services
    const services = await Service.find({ isActive: true })
    if (services.length === 0) {
      console.error('❌ No active services found. Please run seed-sample-data.js first')
      return
    }
    console.log(`✅ Found ${services.length} active services`)
    
    // Get operators (admin and sepideh)
    const operators = await Operator.find({ username: { $in: ['admin', 'sepideh'] } })
    if (operators.length === 0) {
      console.error('❌ No admin or sepideh operators found')
      return
    }
    console.log(`✅ Found ${operators.length} operators:`, operators.map(op => op.username))
    
    console.log('🚀 Creating 1000 test sessions...')
    
    const sessions = []
    const batchSize = 100
    
    for (let i = 0; i < 1000; i++) {
      const customer = getRandomElement(customers)
      const operator = getRandomElement(operators)
      const startTime = getRandomDate()
      
      // Generate end time (session duration + start time)
      const sessionDuration = getRandomDuration()
      const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000)
      
      // Generate random services for this session
      const sessionServices = generateRandomServices(services)
      const totalCost = sessionServices.reduce((sum, service) => sum + service.totalCost, 0)
      
      // Add start and end times to time-based services
      sessionServices.forEach(service => {
        if (service.serviceType === 'time-based') {
          service.startTime = startTime
          service.endTime = endTime
        }
      })
      
      const session = {
        customerId: customer._id.toString(),
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        operatorId: operator._id.toString(),
        startTime: startTime,
        endTime: endTime,
        status: 'completed',
        services: sessionServices,
        totalCost: totalCost,
        notes: `جلسه تست تصادفی - ${i + 1}`,
        completedByOperator: operator.username
      }
      
      sessions.push(session)
      
      // Insert in batches to avoid memory issues
      if (sessions.length === batchSize || i === 999) {
        await Session.insertMany(sessions)
        console.log(`✅ Inserted batch: ${Math.floor(i / batchSize) + 1} (${sessions.length} sessions)`)
        sessions.length = 0 // Clear array
      }
    }
    
    // Calculate total revenue
    const allTestSessions = await Session.find({ notes: /جلسه تست تصادفی/ })
    const totalRevenue = allTestSessions.reduce((sum, session) => sum + (session.totalCost || 0), 0)
    
    console.log('\n🎉 Successfully created 1000 test sessions!')
    console.log(`💰 Total revenue from test sessions: ${totalRevenue.toLocaleString('fa-IR')} تومان`)
    console.log(`📊 Average revenue per session: ${Math.round(totalRevenue / 1000).toLocaleString('fa-IR')} تومان`)
    console.log(`👥 Sessions distributed among ${customers.length} customers`)
    console.log(`🎮 Using ${services.length} different services`)
    console.log(`👨‍💼 Managed by ${operators.length} operators: ${operators.map(op => op.username).join(', ')}`)
    console.log('\n📈 You can now view detailed reports in the dashboard!')
    
  } catch (error) {
    console.error('❌ Error creating test sessions:', error)
  }
}

async function main() {
  await connectDB()
  await createTestSessions()
  await mongoose.disconnect()
  console.log('\n✅ Disconnected from MongoDB')
}

main().catch(console.error)