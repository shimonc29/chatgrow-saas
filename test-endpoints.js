
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    console.log('🧪 Testing ChatGrow Endpoints...\n');
    
    const tests = [
        { name: 'Root API', url: `${BASE_URL}/api` },
        { name: 'Health Check', url: `${BASE_URL}/health` },
        { name: 'Dashboard', url: `${BASE_URL}/dashboard` },
        { name: 'Auth Info', url: `${BASE_URL}/api/auth` },
        { name: 'Logs Info', url: `${BASE_URL}/api/logs` },
        { name: 'Queue Status', url: `${BASE_URL}/api/queue/status` },
        { name: 'WhatsApp Info', url: `${BASE_URL}/api/whatsapp` }
    ];
    
    for (const test of tests) {
        try {
            const response = await axios.get(test.url, { timeout: 5000 });
            console.log(`✅ ${test.name}: ${response.status} - ${response.statusText}`);
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.response?.status || 'FAILED'} - ${error.message}`);
        }
    }
    
    console.log('\n🎯 Basic testing completed!');
}

testEndpoints().catch(console.error);
