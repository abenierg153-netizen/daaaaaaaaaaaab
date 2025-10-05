const https = require('https');
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      resolve({
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', () => {
      resolve({ status: 0, success: false });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, success: false });
    });
  });
}

async function verifySystem() {
  console.log('🔍 Verifying system functionality...\n');
  
  const tests = [
    { name: 'Home Page', url: 'http://localhost:3000' },
    { name: 'Login Page', url: 'http://localhost:3000/login' },
    { name: 'Admin Dashboard', url: 'http://localhost:3000/admin' }
  ];
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await testEndpoint(test.url);
    
    if (result.success) {
      console.log(`✅ ${test.name}: OK (${result.status})`);
    } else {
      console.log(`❌ ${test.name}: FAILED (${result.status})`);
    }
  }
  
  console.log('\n🎯 System Verification Complete!');
  console.log('\n📊 Access Information:');
  console.log('🏠 Home: http://localhost:3000');
  console.log('🔐 Login: http://localhost:3000/login');
  console.log('👑 Admin: http://localhost:3000/admin');
  console.log('\n👤 Admin Credentials:');
  console.log('📧 Email: admin@smileflow.com');
  console.log('🔑 Password: admin123');
  console.log('\n⚠️  Note: Admin user needs to be created in Supabase Dashboard');
}

verifySystem();