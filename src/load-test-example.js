const loadTestSystem = require('./tests/loadTest');
const { formatTestResults, saveTestResults, createTestData } = require('./utils/testUtils');
const { logInfo, logError } = require('./utils/logger');

async function runLoadTestDemonstration() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    CHATGROW LOAD TEST DEMO                   ║
╚══════════════════════════════════════════════════════════════╝

This demonstration shows various load test scenarios for the ChatGrow system.
`);

    try {
        // Initialize the load test system
        await loadTestSystem.init();
        console.log('✅ Load test system initialized\n');

        // Test 1: Basic 500 message test
        await demonstrateBasicLoadTest();
        
        // Test 2: Stress test with high concurrency
        await demonstrateStressTest();
        
        // Test 3: Rate limit testing
        await demonstrateRateLimitTest();
        
        // Test 4: Performance test
        await demonstratePerformanceTest();
        
        // Test 5: Custom scenario test
        await demonstrateCustomScenario();

        console.log('\n🎉 All load test demonstrations completed successfully!');
        
    } catch (error) {
        logError('Load test demonstration failed', { error: error.message });
        console.error('❌ Demonstration failed:', error.message);
    } finally {
        await loadTestSystem.cleanup();
    }
}

async function demonstrateBasicLoadTest() {
    console.log('📋 Test 1: Basic 500 Message Load Test');
    console.log('   Testing standard message sending with default settings...\n');
    
    const config = {
        messageCount: 500,
        connectionId: 'demo-connection-1',
        messageTemplate: 'Basic test message #{number} from ChatGrow Demo',
        delayBetweenMessages: 1000,
        maxConcurrentMessages: 5,
        enableRateLimiting: true,
        enableHealthChecks: true
    };
    
    try {
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        console.log(`✅ Basic load test completed in ${Math.round((endTime - startTime) / 1000)}s`);
        console.log(`   Delivery Rate: ${results.deliveryRate.toFixed(2)}%`);
        console.log(`   Ban Rate: ${results.banRate.toFixed(2)}%`);
        console.log(`   Average Time: ${Math.round(results.averageTimePerMessage)}ms`);
        console.log(`   Status: ${results.deliveryRate >= 98 && results.banRate <= 0.5 ? 'PASSED' : 'FAILED'}\n`);
        
        // Save results
        await saveTestResults(results, 'basic-load-test-results.json');
        
    } catch (error) {
        console.error(`❌ Basic load test failed: ${error.message}\n`);
    }
}

async function demonstrateStressTest() {
    console.log('📋 Test 2: Stress Test (High Concurrency)');
    console.log('   Testing system under high load with maximum concurrency...\n');
    
    const config = {
        messageCount: 200,
        connectionId: 'demo-connection-2',
        messageTemplate: 'Stress test message #{number} - High load simulation',
        delayBetweenMessages: 100, // Very fast
        maxConcurrentMessages: 20, // High concurrency
        enableRateLimiting: true,
        enableHealthChecks: true
    };
    
    try {
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        console.log(`✅ Stress test completed in ${Math.round((endTime - startTime) / 1000)}s`);
        console.log(`   Delivery Rate: ${results.deliveryRate.toFixed(2)}%`);
        console.log(`   Ban Rate: ${results.banRate.toFixed(2)}%`);
        console.log(`   Throughput: ${(results.successfulMessages / ((endTime - startTime) / 1000)).toFixed(2)} msg/s`);
        console.log(`   Status: ${results.deliveryRate >= 95 && results.banRate <= 1 ? 'PASSED' : 'FAILED'}\n`);
        
        // Save results
        await saveTestResults(results, 'stress-test-results.json');
        
    } catch (error) {
        console.error(`❌ Stress test failed: ${error.message}\n`);
    }
}

async function demonstrateRateLimitTest() {
    console.log('📋 Test 3: Rate Limit Test');
    console.log('   Testing rate limiting functionality with aggressive sending...\n');
    
    const config = {
        messageCount: 100,
        connectionId: 'demo-connection-3',
        messageTemplate: 'Rate limit test message #{number}',
        delayBetweenMessages: 50, // Very aggressive
        maxConcurrentMessages: 10,
        enableRateLimiting: true,
        enableHealthChecks: false // Disable health checks for pure rate limit testing
    };
    
    try {
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        console.log(`✅ Rate limit test completed in ${Math.round((endTime - startTime) / 1000)}s`);
        console.log(`   Blocked Messages: ${results.blockedMessages}`);
        console.log(`   Block Rate: ${results.banRate.toFixed(2)}%`);
        console.log(`   Successful: ${results.successfulMessages}`);
        console.log(`   Rate Limiting: ${results.blockedMessages > 0 ? 'WORKING' : 'NOT TRIGGERED'}\n`);
        
        // Save results
        await saveTestResults(results, 'rate-limit-test-results.json');
        
    } catch (error) {
        console.error(`❌ Rate limit test failed: ${error.message}\n`);
    }
}

async function demonstratePerformanceTest() {
    console.log('📋 Test 4: Performance Test');
    console.log('   Testing system performance with optimized settings...\n');
    
    const config = {
        messageCount: 1000,
        connectionId: 'demo-connection-4',
        messageTemplate: 'Performance test message #{number} - Optimized settings',
        delayBetweenMessages: 500, // Balanced
        maxConcurrentMessages: 8,
        enableRateLimiting: true,
        enableHealthChecks: true
    };
    
    try {
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        const duration = (endTime - startTime) / 1000;
        const throughput = results.successfulMessages / duration;
        
        console.log(`✅ Performance test completed in ${Math.round(duration)}s`);
        console.log(`   Delivery Rate: ${results.deliveryRate.toFixed(2)}%`);
        console.log(`   Throughput: ${throughput.toFixed(2)} msg/s`);
        console.log(`   Average Time: ${Math.round(results.averageTimePerMessage)}ms`);
        console.log(`   P95 Time: ${results.performanceMetrics.p95Time}ms`);
        console.log(`   P99 Time: ${results.performanceMetrics.p99Time}ms`);
        console.log(`   Performance: ${throughput > 1.5 ? 'EXCELLENT' : throughput > 1.0 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\n`);
        
        // Save results
        await saveTestResults(results, 'performance-test-results.json');
        
    } catch (error) {
        console.error(`❌ Performance test failed: ${error.message}\n`);
    }
}

async function demonstrateCustomScenario() {
    console.log('📋 Test 5: Custom Scenario Test');
    console.log('   Testing custom business scenario with specific requirements...\n');
    
    const config = {
        messageCount: 300,
        connectionId: 'demo-connection-5',
        messageTemplate: 'Custom scenario: Welcome to ChatGrow! Your account #{number} is now active.',
        delayBetweenMessages: 2000, // Slower, more realistic
        maxConcurrentMessages: 3, // Conservative
        enableRateLimiting: true,
        enableHealthChecks: true
    };
    
    try {
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        console.log(`✅ Custom scenario test completed in ${Math.round((endTime - startTime) / 1000)}s`);
        console.log(`   Delivery Rate: ${results.deliveryRate.toFixed(2)}%`);
        console.log(`   Ban Rate: ${results.banRate.toFixed(2)}%`);
        console.log(`   Total Time: ${Math.round(results.totalTime)}ms`);
        console.log(`   Recommendations: ${results.recommendations.length}`);
        
        if (results.recommendations.length > 0) {
            console.log('   💡 Key recommendations:');
            results.recommendations.slice(0, 3).forEach(rec => {
                console.log(`      - ${rec.message}`);
            });
        }
        
        console.log(`   Status: ${results.deliveryRate >= 98 && results.banRate <= 0.5 ? 'PASSED' : 'FAILED'}\n`);
        
        // Save results
        await saveTestResults(results, 'custom-scenario-results.json');
        
    } catch (error) {
        console.error(`❌ Custom scenario test failed: ${error.message}\n`);
    }
}

async function demonstrateTestDataCreation() {
    console.log('📋 Test Data Creation Examples');
    
    // Create different types of test data
    const normalData = createTestData('normal', 10);
    const stressData = createTestData('stress', 10);
    const spikeData = createTestData('spike', 10);
    const gradualData = createTestData('gradual', 10);
    
    console.log('   Normal test data:', normalData.length, 'items');
    console.log('   Stress test data:', stressData.length, 'items');
    console.log('   Spike test data:', spikeData.length, 'items');
    console.log('   Gradual test data:', gradualData.length, 'items');
    
    console.log('\n   Example normal data item:', normalData[0]);
    console.log('   Example stress data item:', stressData[0]);
    console.log('   Example spike data item:', spikeData[0]);
    console.log('   Example gradual data item:', gradualData[0]);
    console.log();
}

async function demonstrateRealTimeMonitoring() {
    console.log('📋 Real-Time Test Monitoring');
    console.log('   Demonstrating how to monitor a running test...\n');
    
    // Start a test in the background
    const testConfig = {
        messageCount: 50,
        connectionId: 'monitor-demo',
        delayBetweenMessages: 2000, // Slow for monitoring
        maxConcurrentMessages: 2
    };
    
    try {
        // Start the test
        const testPromise = loadTestSystem.runLoadTest(testConfig);
        
        // Monitor the test progress
        const monitorInterval = setInterval(async () => {
            const status = await loadTestSystem.getTestStatus();
            
            if (status.status === 'running') {
                console.log(`   Progress: ${status.progress.percentage.toFixed(1)}% (${status.progress.completed}/${status.progress.total})`);
                console.log(`   Queue: ${status.queue.waiting} waiting, ${status.queue.active} active`);
                console.log(`   Stats: ${status.currentStats.successful} successful, ${status.currentStats.failed} failed, ${status.currentStats.blocked} blocked`);
                console.log();
            } else {
                clearInterval(monitorInterval);
            }
        }, 3000); // Check every 3 seconds
        
        // Wait for test to complete
        const results = await testPromise;
        clearInterval(monitorInterval);
        
        console.log(`✅ Monitoring demo completed`);
        console.log(`   Final delivery rate: ${results.deliveryRate.toFixed(2)}%\n`);
        
    } catch (error) {
        console.error(`❌ Monitoring demo failed: ${error.message}\n`);
    }
}

// Example usage functions
async function exampleBasicUsage() {
    console.log('🔧 Basic Usage Example:');
    
    const config = {
        messageCount: 100,
        connectionId: 'example-connection',
        delayBetweenMessages: 1000
    };
    
    try {
        await loadTestSystem.init();
        const results = await loadTestSystem.runLoadTest(config);
        
        console.log('Results:', {
            deliveryRate: `${results.deliveryRate.toFixed(2)}%`,
            banRate: `${results.banRate.toFixed(2)}%`,
            totalTime: `${Math.round(results.totalTime)}ms`
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await loadTestSystem.cleanup();
    }
}

async function exampleAdvancedUsage() {
    console.log('🔧 Advanced Usage Example:');
    
    const config = {
        messageCount: 500,
        connectionId: 'advanced-connection',
        messageTemplate: 'Advanced test #{number} - {timestamp}',
        delayBetweenMessages: 500,
        maxConcurrentMessages: 10,
        enableRateLimiting: true,
        enableHealthChecks: true
    };
    
    try {
        await loadTestSystem.init();
        
        // Start monitoring
        const monitorInterval = setInterval(async () => {
            const status = await loadTestSystem.getTestStatus();
            if (status.status === 'running') {
                console.log(`Progress: ${status.progress.percentage.toFixed(1)}%`);
            }
        }, 5000);
        
        const results = await loadTestSystem.runLoadTest(config);
        clearInterval(monitorInterval);
        
        // Format and display results
        const formattedResults = formatTestResults(results);
        console.log(formattedResults);
        
        // Save results
        await saveTestResults(results);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await loadTestSystem.cleanup();
    }
}

// Export functions for external use
module.exports = {
    runLoadTestDemonstration,
    demonstrateBasicLoadTest,
    demonstrateStressTest,
    demonstrateRateLimitTest,
    demonstratePerformanceTest,
    demonstrateCustomScenario,
    demonstrateTestDataCreation,
    demonstrateRealTimeMonitoring,
    exampleBasicUsage,
    exampleAdvancedUsage
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    runLoadTestDemonstration();
} 