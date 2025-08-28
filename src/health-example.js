const healthService = require('./services/healthService');
const { alertService, sendAlert } = require('./utils/alerts');
const { logInfo, logError } = require('./utils/logger');

async function runHealthDemonstration() {
    console.log('🏥 Starting Health Monitoring System Demonstration...\n');

    try {
        // 1. Basic Health Check
        console.log('1️⃣ Running Basic Health Check...');
        const basicHealth = await healthService.runFullHealthCheck();
        console.log('✅ Basic Health Check Results:');
        console.log(`   Overall Status: ${basicHealth.overall}`);
        console.log(`   Response Time: ${basicHealth.responseTime}ms`);
        console.log(`   Timestamp: ${basicHealth.timestamp}`);
        
        Object.entries(basicHealth.checks).forEach(([service, check]) => {
            console.log(`   ${service}: ${check.status} (${check.responseTime}ms)`);
        });
        console.log('');

        // 2. Detailed Health Check
        console.log('2️⃣ Running Detailed Health Check...');
        const detailedHealth = await healthService.runDetailedHealthCheck();
        console.log('✅ Detailed Health Check Results:');
        console.log(`   Performance Metrics:`);
        console.log(`     - Avg Response Time: ${detailedHealth.detailed.performance.avgResponseTime}ms`);
        console.log(`     - Success Rate: ${(detailedHealth.detailed.performance.successRate * 100).toFixed(2)}%`);
        console.log(`     - Uptime: ${Math.floor(detailedHealth.detailed.performance.uptime / 1000)}s`);
        console.log(`     - Total Checks: ${detailedHealth.detailed.performance.totalChecks}`);
        console.log(`     - Failed Checks: ${detailedHealth.detailed.performance.failedChecks}`);
        console.log('');

        // 3. Individual Service Checks
        console.log('3️⃣ Running Individual Service Checks...');
        
        const mongoHealth = await healthService.checkMongoDB();
        console.log('✅ MongoDB Health:');
        console.log(`   Status: ${mongoHealth.status}`);
        console.log(`   Response Time: ${mongoHealth.responseTime}ms`);
        console.log(`   Connected: ${mongoHealth.isConnected}`);
        console.log(`   Query Time: ${mongoHealth.queryTime}ms`);
        console.log('');

        const redisHealth = await healthService.checkRedis();
        console.log('✅ Redis Health:');
        console.log(`   Status: ${redisHealth.status}`);
        console.log(`   Response Time: ${redisHealth.responseTime}ms`);
        console.log(`   Ping Time: ${redisHealth.pingTime}ms`);
        console.log('');

        const queueHealth = await healthService.checkQueue();
        console.log('✅ Queue Health:');
        console.log(`   Status: ${queueHealth.status}`);
        console.log(`   Response Time: ${queueHealth.responseTime}ms`);
        console.log(`   Job Count: ${queueHealth.jobCount}`);
        console.log(`   Avg Latency: ${queueHealth.avgLatency}ms`);
        console.log(`   Details:`, queueHealth.details);
        console.log('');

        const whatsAppHealth = await healthService.checkWhatsAppConnections();
        console.log('✅ WhatsApp Connections Health:');
        console.log(`   Status: ${whatsAppHealth.status}`);
        console.log(`   Response Time: ${whatsAppHealth.responseTime}ms`);
        console.log(`   Health Score: ${whatsAppHealth.healthScore}`);
        console.log(`   Details:`, whatsAppHealth.details);
        console.log('');

        const systemHealth = healthService.checkSystemResources();
        console.log('✅ System Resources Health:');
        console.log(`   Status: ${systemHealth.status}`);
        console.log(`   Response Time: ${systemHealth.responseTime}ms`);
        console.log(`   Memory Usage: ${(systemHealth.details.memory.usagePercent * 100).toFixed(2)}%`);
        console.log(`   Uptime: ${Math.floor(systemHealth.details.uptime)}s`);
        console.log('');

        // 4. Dashboard Data
        console.log('4️⃣ Getting Dashboard Data...');
        const dashboardData = await healthService.getDashboardData();
        console.log('✅ Dashboard Data:');
        console.log(`   Overall Health: ${dashboardData.health}`);
        console.log(`   Connections: ${dashboardData.connections.total} total, ${dashboardData.connections.active} active, ${dashboardData.connections.error} errors`);
        console.log(`   Queue: ${dashboardData.queue.waiting} waiting, ${dashboardData.queue.throughput} throughput, ${(dashboardData.queue.errorRate * 100).toFixed(2)}% error rate`);
        console.log(`   Memory Usage: ${(dashboardData.system.memory.usagePercent * 100).toFixed(2)}%`);
        console.log(`   Last Updated: ${dashboardData.lastUpdated}`);
        console.log('');

        // 5. Performance Metrics
        console.log('5️⃣ Getting Performance Metrics...');
        const performanceMetrics = await healthService.getPerformanceMetrics();
        console.log('✅ Performance Metrics:');
        console.log(`   Average Response Time: ${performanceMetrics.avgResponseTime}ms`);
        console.log(`   Success Rate: ${(performanceMetrics.successRate * 100).toFixed(2)}%`);
        console.log(`   Uptime: ${Math.floor(performanceMetrics.uptime / 1000)}s`);
        console.log(`   Total Checks: ${performanceMetrics.totalChecks}`);
        console.log(`   Failed Checks: ${performanceMetrics.failedChecks}`);
        console.log('');

        // 6. Connection Metrics
        console.log('6️⃣ Getting Connection Metrics...');
        const connectionMetrics = await healthService.getConnectionMetrics();
        console.log('✅ Connection Metrics:');
        console.log(`   Total Connections: ${connectionMetrics.total}`);
        console.log(`   By Status:`, connectionMetrics.byStatus);
        console.log(`   By User:`, connectionMetrics.byUser);
        console.log('');

        // 7. Queue Metrics
        console.log('7️⃣ Getting Queue Metrics...');
        const queueMetrics = await healthService.getQueueMetrics();
        console.log('✅ Queue Metrics:');
        console.log(`   Current Load: ${queueMetrics.currentLoad}`);
        console.log(`   Throughput: ${queueMetrics.throughput} messages/min`);
        console.log(`   Error Rate: ${(queueMetrics.errorRate * 100).toFixed(2)}%`);
        console.log(`   Avg Processing Time: ${queueMetrics.avgProcessingTime}ms`);
        console.log('');

        // 8. Alert System Test
        console.log('8️⃣ Testing Alert System...');
        await testAlertSystem();
        console.log('');

        // 9. Health History
        console.log('9️⃣ Getting Health History...');
        const healthHistory = Array.from(healthService.healthChecks.values()).slice(-5);
        console.log('✅ Recent Health Checks:');
        healthHistory.forEach((check, index) => {
            console.log(`   ${index + 1}. ${check.timestamp} - ${check.overall} (${check.responseTime}ms)`);
        });
        console.log('');

        console.log('🎉 Health Monitoring System Demonstration Completed Successfully!');
        console.log('');
        console.log('📊 Available Health API Endpoints:');
        console.log('   GET /api/health                    - Basic health check');
        console.log('   GET /api/health/detailed           - Detailed health check');
        console.log('   GET /api/health/connections        - WhatsApp connections status');
        console.log('   GET /api/health/dashboard          - Dashboard data');
        console.log('   GET /api/health/mongodb            - MongoDB health');
        console.log('   GET /api/health/redis              - Redis health');
        console.log('   GET /api/health/queue              - Queue health');
        console.log('   GET /api/health/system             - System resources');
        console.log('   GET /api/health/performance        - Performance metrics');
        console.log('   GET /api/health/history            - Health check history');
        console.log('   GET /api/health/config             - Health configuration');
        console.log('   POST /api/health/trigger           - Manual health check trigger');

    } catch (error) {
        logError('Health demonstration failed', error);
        console.error('❌ Health demonstration failed:', error.message);
    }
}

async function testAlertSystem() {
    try {
        console.log('   Testing Email Alert...');
        const emailResult = await alertService.testAlert('email');
        console.log(`   ✅ Email alert sent: ${emailResult ? 'Success' : 'Failed'}`);

        console.log('   Testing Slack Alert...');
        const slackResult = await alertService.testAlert('slack');
        console.log(`   ✅ Slack alert sent: ${slackResult ? 'Success' : 'Failed'}`);

        console.log('   Testing Custom Alert...');
        const customResult = await sendAlert({
            type: 'test',
            severity: 'info',
            title: 'Test Alert from Health Demo',
            message: 'This is a test alert from the health monitoring demonstration',
            details: {
                test: true,
                timestamp: new Date().toISOString(),
                demo: 'health_monitoring'
            },
            channels: ['email', 'slack'],
            cooldown: false
        });
        console.log(`   ✅ Custom alert sent: ${customResult ? 'Success' : 'Failed'}`);

        // Get alert statistics
        const alertStats = alertService.getAlertStats();
        console.log('   📊 Alert Statistics:');
        console.log(`      Total Alerts: ${alertStats.total}`);
        console.log(`      Last Hour: ${alertStats.lastHour}`);
        console.log(`      Last Day: ${alertStats.lastDay}`);
        console.log(`      Channels: ${alertStats.channels.join(', ')}`);

    } catch (error) {
        console.log(`   ❌ Alert test failed: ${error.message}`);
    }
}

async function demonstrateHealthMonitoring() {
    console.log('🔍 Demonstrating Health Monitoring Features...\n');

    try {
        // Simulate health issues
        console.log('1️⃣ Simulating Health Issues...');
        
        // Simulate MongoDB slow response
        console.log('   Simulating MongoDB slow response...');
        const originalMongoCheck = healthService.checkMongoDB;
        healthService.checkMongoDB = async () => ({
            status: 'unhealthy',
            responseTime: 2000,
            error: 'Simulated slow response',
            readyState: 1,
            isConnected: true,
            queryTime: 2000
        });

        // Run health check with simulated issue
        const healthWithIssue = await healthService.runFullHealthCheck();
        console.log(`   ✅ Health check with issue: ${healthWithIssue.overall}`);
        
        // Restore original function
        healthService.checkMongoDB = originalMongoCheck;

        // 2. Test alert cooldown
        console.log('2️⃣ Testing Alert Cooldown...');
        const alert1 = await sendAlert({
            type: 'test_cooldown',
            severity: 'warning',
            title: 'Test Alert 1',
            message: 'First test alert',
            cooldown: true
        });
        console.log(`   ✅ First alert sent: ${alert1 ? 'Success' : 'Failed'}`);

        const alert2 = await sendAlert({
            type: 'test_cooldown',
            severity: 'warning',
            title: 'Test Alert 2',
            message: 'Second test alert (should be suppressed)',
            cooldown: true
        });
        console.log(`   ✅ Second alert sent: ${alert2 ? 'Success' : 'Failed'} (should be suppressed)`);

        // 3. Test different alert types
        console.log('3️⃣ Testing Different Alert Types...');
        
        await sendAlert({
            type: 'health_issue',
            severity: 'warning',
            title: 'Simulated Health Issue',
            message: 'This is a simulated health issue for testing',
            details: {
                issues: [
                    { service: 'mongodb', error: 'Simulated error', responseTime: 2000 }
                ],
                overallHealth: 'unhealthy'
            }
        });

        await sendAlert({
            type: 'rate_limit_warning',
            severity: 'warning',
            title: 'Rate Limit Warning',
            message: 'Connection approaching rate limit',
            details: {
                connectionId: 'test_connection',
                messageCount: 45,
                dailyLimit: 50
            }
        });

        console.log('   ✅ Different alert types tested');

        console.log('🎉 Health Monitoring Features Demonstration Completed!');

    } catch (error) {
        logError('Health monitoring demonstration failed', error);
        console.error('❌ Health monitoring demonstration failed:', error.message);
    }
}

async function demonstratePerformanceMonitoring() {
    console.log('⚡ Demonstrating Performance Monitoring...\n');

    try {
        // Simulate performance metrics collection
        console.log('1️⃣ Collecting Performance Metrics...');
        
        for (let i = 0; i < 10; i++) {
            await healthService.runFullHealthCheck();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }

        const performanceMetrics = await healthService.getPerformanceMetrics();
        console.log('✅ Performance Metrics Collected:');
        console.log(`   Average Response Time: ${performanceMetrics.avgResponseTime}ms`);
        console.log(`   Success Rate: ${(performanceMetrics.successRate * 100).toFixed(2)}%`);
        console.log(`   Total Checks: ${performanceMetrics.totalChecks}`);
        console.log(`   Failed Checks: ${performanceMetrics.failedChecks}`);

        // 2. Test system metrics
        console.log('2️⃣ System Metrics...');
        const systemMetrics = healthService.getSystemMetrics();
        console.log('✅ System Metrics:');
        console.log(`   Memory Usage: ${(systemMetrics.memory.usagePercent * 100).toFixed(2)}%`);
        console.log(`   Uptime: ${Math.floor(systemMetrics.uptime)}s`);
        console.log(`   Node Version: ${systemMetrics.nodeVersion}`);
        console.log(`   Platform: ${systemMetrics.platform}`);

        console.log('🎉 Performance Monitoring Demonstration Completed!');

    } catch (error) {
        logError('Performance monitoring demonstration failed', error);
        console.error('❌ Performance monitoring demonstration failed:', error.message);
    }
}

// Example API usage
async function exampleApiUsage() {
    console.log('🌐 Health API Usage Examples...\n');

    const baseUrl = 'http://localhost:3000/api/health';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN' // Replace with actual token
    };

    const examples = [
        {
            name: 'Basic Health Check',
            method: 'GET',
            url: `${baseUrl}`,
            description: 'Get basic system health status (no auth required)'
        },
        {
            name: 'Detailed Health Check',
            method: 'GET',
            url: `${baseUrl}/detailed`,
            description: 'Get detailed health information with metrics'
        },
        {
            name: 'Dashboard Data',
            method: 'GET',
            url: `${baseUrl}/dashboard`,
            description: 'Get dashboard data for monitoring UI'
        },
        {
            name: 'WhatsApp Connections',
            method: 'GET',
            url: `${baseUrl}/connections`,
            description: 'Get WhatsApp connections health status'
        },
        {
            name: 'Performance Metrics',
            method: 'GET',
            url: `${baseUrl}/performance`,
            description: 'Get performance metrics and statistics'
        },
        {
            name: 'Health History',
            method: 'GET',
            url: `${baseUrl}/history?limit=10`,
            description: 'Get recent health check history'
        },
        {
            name: 'Manual Health Check',
            method: 'POST',
            url: `${baseUrl}/trigger`,
            body: { type: 'detailed' },
            description: 'Trigger manual health check (admin only)'
        }
    ];

    console.log('📋 Available API Endpoints:');
    examples.forEach((example, index) => {
        console.log(`\n${index + 1}. ${example.name}`);
        console.log(`   ${example.method} ${example.url}`);
        console.log(`   ${example.description}`);
        if (example.body) {
            console.log(`   Body: ${JSON.stringify(example.body)}`);
        }
    });

    console.log('\n📝 Example cURL Commands:');
    console.log('\n# Basic health check (no auth required)');
    console.log(`curl -X GET "${baseUrl}"`);
    
    console.log('\n# Detailed health check (requires auth)');
    console.log(`curl -X GET "${baseUrl}/detailed" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN"`);
    
    console.log('\n# Dashboard data (requires auth)');
    console.log(`curl -X GET "${baseUrl}/dashboard" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN"`);
    
    console.log('\n# Manual health check trigger (admin only)');
    console.log(`curl -X POST "${baseUrl}/trigger" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"type": "detailed"}'`);
}

// Run demonstration if this file is executed directly
if (require.main === module) {
    (async () => {
        await runHealthDemonstration();
        console.log('\n' + '='.repeat(60) + '\n');
        await demonstrateHealthMonitoring();
        console.log('\n' + '='.repeat(60) + '\n');
        await demonstratePerformanceMonitoring();
        console.log('\n' + '='.repeat(60) + '\n');
        exampleApiUsage();
    })();
}

module.exports = {
    runHealthDemonstration,
    demonstrateHealthMonitoring,
    demonstratePerformanceMonitoring,
    exampleApiUsage
}; 