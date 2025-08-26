import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const envPath = join(__dirname, '..', '.env.local');
let JWT_SECRET = 'your-secret-key';

try {
  const envContent = readFileSync(envPath, 'utf8');
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch) {
    JWT_SECRET = jwtSecretMatch[1].trim();
  }
} catch (error) {
  console.log('Could not read .env.local file, using default JWT_SECRET');
}

// Simple JWT creation for testing (without external dependencies)
async function createTestJWT() {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId: '689cabfab050291b0ee59e4c', // Real admin user ID from database
    username: 'admin',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Simple HMAC-SHA256 signature (for testing purposes only)
  const crypto = await import('crypto');
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

async function testCustomersAPI() {
  console.log('Testing customers API...');
  
  try {
    const token = await createTestJWT();
    console.log('Generated JWT token for testing');
    
    // Test GET /api/customers
    console.log('Making request to http://localhost:4040/api/customers');
    const response = await fetch('http://localhost:4040/api/customers', {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Customers API test successful!');
    console.log(`Found ${data.customers ? data.customers.length : 0} customers`);
    
    if (data.customers && data.customers.length > 0) {
      console.log('Sample customer:', data.customers[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing customers API:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication failed. This could be because:');
      console.log('1. The JWT_SECRET in .env.local doesn\'t match the server');
      console.log('2. The test user ID doesn\'t exist in the database');
      console.log('3. The server is not running on http://localhost:3000');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 Connection failed. Make sure the server is running with: npm run dev');
      console.log('Check if http://localhost:3000 is accessible');
    }
  }
}

// Run the test
testCustomersAPI();