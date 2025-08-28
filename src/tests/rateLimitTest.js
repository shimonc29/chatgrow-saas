#!/usr/bin/env node

const { getRateLimitData, canSendMessage, updateRateLimitAfterMessage, pauseRateLimit, resumeRateLimit } = require('../utils/rateLimitUtils');
const { logInfo, logError, logWarning } = require('../utils/logger');
const { measureTime, calculateStatistics, formatTestResults, saveTestResults } = require('../utils/testUtils');

class RateLimitTestSystem {
    constructor() {
        this.testResults = {
            testId: `rate-limit-test-${Date.now()}`,
            startTime: null,
            endTime: null,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: [],
            errors: [],
            performanceMetrics: {
                responseTimes: [],
                minTime: Infinity,
                maxTime: 0,
                averageTime: 0
            },
            rateLimitTests: {
                basicFunctionality: { passed: false, details: {} },
                jitterCalculation: { passed: false, details: {} },
                pauseResume: { passed: false, details: {} },
                concurrentAccess: { passed: false, details: {} },
                edgeCases: { passed: false, details: {} }
            }
        };
    }

    async runRateLimitTests() {
        this.testResults.startTime = new Date();
        
        logInfo('Starting rate limit tests', { testId: this.testResults.testId });
        
        try {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    RATE LIMIT TESTING                        ║
╚══════════════════════════════════════════════════════════════╝

🧪 Running comprehensive rate limit tests...
`);

            // Test 1: Basic Functionality
            await this.testBasicFunctionality();
            
            // Test 2: Jitter Calculation
            await this.testJitterCalculation();
            
            // Test 3: Pause/Resume Functionality
            await this.testPauseResume();
            
            // Test 4: Concurrent Access
            await this.testConcurrentAccess();
            
            // Test 5: Edge Cases
            await this.testEdgeCases();
            
            this.testResults.endTime = new Date();
            
            // Calculate final statistics
            this.calculateFinalStatistics();
            
            // Display results
            this.displayResults();
            
            return this.testResults;
            
        } catch (error) {
            logError('Rate limit tests failed', { error: error.message });
            this.testResults.errors.push({
                type: 'TEST_FAILURE',
                message: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }

    async testBasicFunctionality() {
        console.log('📋 Test 1: Basic Rate Limit Functionality');
        
        const connectionId = 'test-rate-limit-1';
        const testResults = {
            canSendInitial: false,
            canSendAfterUpdate: false,
            rateLimitData: null,
            responseTime: 0
        };
        
        try {
            // Test initial state
            const initialCheck = await measureTime(canSendMessage, connectionId);
            testResults.canSendInitial = initialCheck.result;
            testResults.responseTime = initialCheck.executionTime;
            
            // Update rate limit
            await updateRateLimitAfterMessage(connectionId);
            
            // Test after update
            const afterUpdateCheck = await measureTime(canSendMessage, connectionId);
            testResults.canSendAfterUpdate = afterUpdateCheck.result;
            
            // Get rate limit data
            const rateLimitData = await getRateLimitData(connectionId);
            testResults.rateLimitData = rateLimitData;
            
            // Validate results
            const passed = this.validateBasicFunctionality(testResults);
            
            this.testResults.rateLimitTests.basicFunctionality = {
                passed,
                details: testResults
            };
            
            this.updatePerformanceMetrics(testResults.responseTime);
            
            console.log(`   ${passed ? '✅' : '❌'} Basic functionality: ${passed ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.testResults.rateLimitTests.basicFunctionality = {
                passed: false,
                details: { error: error.message }
            };
            console.log(`   ❌ Basic functionality: FAILED - ${error.message}`);
        }
    }

    async testJitterCalculation() {
        console.log('📋 Test 2: Jitter Calculation');
        
        const connectionId = 'test-jitter-1';
        const testResults = {
            delays: [],
            averageDelay: 0,
            standardDeviation: 0,
            minDelay: 0,
            maxDelay: 0
        };
        
        try {
            // Test multiple rate limit checks to measure jitter
            for (let i = 0; i < 50; i++) {
                await updateRateLimitAfterMessage(connectionId);
                const rateLimitData = await getRateLimitData(connectionId);
                
                if (rateLimitData.nextAllowedTime) {
                    const delay = rateLimitData.nextAllowedTime - Date.now();
                    if (delay > 0) {
                        testResults.delays.push(delay);
                    }
                }
                
                // Small delay between tests
                await this.sleep(10);
            }
            
            // Calculate statistics
            if (testResults.delays.length > 0) {
                const stats = calculateStatistics(testResults.delays);
                testResults.averageDelay = stats.mean;
                testResults.standardDeviation = stats.standardDeviation;
                testResults.minDelay = stats.min;
                testResults.maxDelay = stats.max;
            }
            
            // Validate jitter (should have some variation)
            const passed = testResults.delays.length > 0 && testResults.standardDeviation > 0;
            
            this.testResults.rateLimitTests.jitterCalculation = {
                passed,
                details: testResults
            };
            
            console.log(`   ${passed ? '✅' : '❌'} Jitter calculation: ${passed ? 'PASSED' : 'FAILED'}`);
            console.log(`      Average delay: ${Math.round(testResults.averageDelay)}ms`);
            console.log(`      Std deviation: ${Math.round(testResults.standardDeviation)}ms`);
            
        } catch (error) {
            this.testResults.rateLimitTests.jitterCalculation = {
                passed: false,
                details: { error: error.message }
            };
            console.log(`   ❌ Jitter calculation: FAILED - ${error.message}`);
        }
    }

    async testPauseResume() {
        console.log('📋 Test 3: Pause/Resume Functionality');
        
        const connectionId = 'test-pause-resume-1';
        const testResults = {
            canSendBeforePause: false,
            canSendAfterPause: false,
            canSendAfterResume: false,
            pauseTime: 0,
            resumeTime: 0
        };
        
        try {
            // Initial state
            testResults.canSendBeforePause = await canSendMessage(connectionId);
            
            // Pause rate limit
            const pauseStart = Date.now();
            await pauseRateLimit(connectionId);
            testResults.pauseTime = Date.now() - pauseStart;
            
            // Check after pause
            testResults.canSendAfterPause = await canSendMessage(connectionId);
            
            // Resume rate limit
            const resumeStart = Date.now();
            await resumeRateLimit(connectionId);
            testResults.resumeTime = Date.now() - resumeStart;
            
            // Check after resume
            testResults.canSendAfterResume = await canSendMessage(connectionId);
            
            // Validate pause/resume functionality
            const passed = !testResults.canSendAfterPause && testResults.canSendAfterResume;
            
            this.testResults.rateLimitTests.pauseResume = {
                passed,
                details: testResults
            };
            
            console.log(`   ${passed ? '✅' : '❌'} Pause/Resume: ${passed ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.testResults.rateLimitTests.pauseResume = {
                passed: false,
                details: { error: error.message }
            };
            console.log(`   ❌ Pause/Resume: FAILED - ${error.message}`);
        }
    }

    async testConcurrentAccess() {
        console.log('📋 Test 4: Concurrent Access');
        
        const connectionId = 'test-concurrent-1';
        const testResults = {
            concurrentChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            averageResponseTime: 0,
            maxResponseTime: 0
        };
        
        try {
            const concurrentPromises = [];
            const responseTimes = [];
            
            // Create 20 concurrent rate limit checks
            for (let i = 0; i < 20; i++) {
                const promise = measureTime(canSendMessage, connectionId);
                concurrentPromises.push(promise);
            }
            
            // Wait for all concurrent operations
            const results = await Promise.all(concurrentPromises);
            
            testResults.concurrentChecks = results.length;
            testResults.successfulChecks = results.filter(r => r.success).length;
            testResults.failedChecks = results.filter(r => !r.success).length;
            
            // Calculate response time statistics
            results.forEach(result => {
                if (result.success) {
                    responseTimes.push(result.executionTime);
                }
            });
            
            if (responseTimes.length > 0) {
                const stats = calculateStatistics(responseTimes);
                testResults.averageResponseTime = stats.mean;
                testResults.maxResponseTime = stats.max;
            }
            
            // Validate concurrent access (should handle multiple requests)
            const passed = testResults.successfulChecks > 0 && testResults.failedChecks === 0;
            
            this.testResults.rateLimitTests.concurrentAccess = {
                passed,
                details: testResults
            };
            
            console.log(`   ${passed ? '✅' : '❌'} Concurrent access: ${passed ? 'PASSED' : 'FAILED'}`);
            console.log(`      Successful: ${testResults.successfulChecks}/${testResults.concurrentChecks}`);
            console.log(`      Avg response: ${Math.round(testResults.averageResponseTime)}ms`);
            
        } catch (error) {
            this.testResults.rateLimitTests.concurrentAccess = {
                passed: false,
                details: { error: error.message }
            };
            console.log(`   ❌ Concurrent access: FAILED - ${error.message}`);
        }
    }

    async testEdgeCases() {
        console.log('📋 Test 5: Edge Cases');
        
        const testResults = {
            emptyConnectionId: false,
            nullConnectionId: false,
            veryLongConnectionId: false,
            specialCharacters: false,
            rapidUpdates: false
        };
        
        try {
            // Test empty connection ID
            try {
                await canSendMessage('');
                testResults.emptyConnectionId = true;
            } catch (error) {
                testResults.emptyConnectionId = false;
            }
            
            // Test null connection ID
            try {
                await canSendMessage(null);
                testResults.nullConnectionId = true;
            } catch (error) {
                testResults.nullConnectionId = false;
            }
            
            // Test very long connection ID
            const longId = 'a'.repeat(1000);
            try {
                await canSendMessage(longId);
                testResults.veryLongConnectionId = true;
            } catch (error) {
                testResults.veryLongConnectionId = false;
            }
            
            // Test special characters
            const specialId = 'test@#$%^&*()_+-=[]{}|;:,.<>?';
            try {
                await canSendMessage(specialId);
                testResults.specialCharacters = true;
            } catch (error) {
                testResults.specialCharacters = false;
            }
            
            // Test rapid updates
            const rapidId = 'test-rapid-1';
            try {
                for (let i = 0; i < 10; i++) {
                    await updateRateLimitAfterMessage(rapidId);
                }
                testResults.rapidUpdates = true;
            } catch (error) {
                testResults.rapidUpdates = false;
            }
            
            // Validate edge cases (should handle gracefully)
            const passed = testResults.rapidUpdates; // Only rapid updates should work
            
            this.testResults.rateLimitTests.edgeCases = {
                passed,
                details: testResults
            };
            
            console.log(`   ${passed ? '✅' : '❌'} Edge cases: ${passed ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.testResults.rateLimitTests.edgeCases = {
                passed: false,
                details: { error: error.message }
            };
            console.log(`   ❌ Edge cases: FAILED - ${error.message}`);
        }
    }

    validateBasicFunctionality(testResults) {
        // Basic functionality should work correctly
        return testResults.canSendInitial !== undefined && 
               testResults.canSendAfterUpdate !== undefined &&
               testResults.rateLimitData !== null;
    }

    updatePerformanceMetrics(responseTime) {
        this.testResults.performanceMetrics.responseTimes.push(responseTime);
        this.testResults.performanceMetrics.minTime = Math.min(this.testResults.performanceMetrics.minTime, responseTime);
        this.testResults.performanceMetrics.maxTime = Math.max(this.testResults.performanceMetrics.maxTime, responseTime);
    }

    calculateFinalStatistics() {
        const responseTimes = this.testResults.performanceMetrics.responseTimes;
        if (responseTimes.length > 0) {
            const stats = calculateStatistics(responseTimes);
            this.testResults.performanceMetrics.averageTime = stats.mean;
        }
        
        // Count passed/failed tests
        const tests = this.testResults.rateLimitTests;
        this.testResults.totalTests = Object.keys(tests).length;
        this.testResults.passedTests = Object.values(tests).filter(test => test.passed).length;
        this.testResults.failedTests = this.testResults.totalTests - this.testResults.passedTests;
    }

    displayResults() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    RATE LIMIT TEST RESULTS                   ║
╚══════════════════════════════════════════════════════════════╝

📊 Summary:
   Test ID: ${this.testResults.testId}
   Total Tests: ${this.testResults.totalTests}
   Passed: ${this.testResults.passedTests}
   Failed: ${this.testResults.failedTests}
   Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%

⚡ Performance:
   Average Response Time: ${Math.round(this.testResults.performanceMetrics.averageTime)}ms
   Min Response Time: ${Math.round(this.testResults.performanceMetrics.minTime)}ms
   Max Response Time: ${Math.round(this.testResults.performanceMetrics.maxTime)}ms

🧪 Test Details:
   Basic Functionality: ${this.testResults.rateLimitTests.basicFunctionality.passed ? '✅ PASSED' : '❌ FAILED'}
   Jitter Calculation: ${this.testResults.rateLimitTests.jitterCalculation.passed ? '✅ PASSED' : '❌ FAILED'}
   Pause/Resume: ${this.testResults.rateLimitTests.pauseResume.passed ? '✅ PASSED' : '❌ FAILED'}
   Concurrent Access: ${this.testResults.rateLimitTests.concurrentAccess.passed ? '✅ PASSED' : '❌ FAILED'}
   Edge Cases: ${this.testResults.rateLimitTests.edgeCases.passed ? '✅ PASSED' : '❌ FAILED'}

${this.testResults.errors.length > 0 ? `
⚠️  Errors:
${this.testResults.errors.map(error => `   - ${error.message}`).join('\n')}
` : ''}

${this.testResults.warnings.length > 0 ? `
⚠️  Warnings:
${this.testResults.warnings.map(warning => `   - ${warning}`).join('\n')}
` : ''}

${this.testResults.passedTests === this.testResults.totalTests ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}
`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function runRateLimitTests() {
    const testSystem = new RateLimitTestSystem();
    
    try {
        const results = await testSystem.runRateLimitTests();
        
        // Save results
        try {
            const savedFile = await saveTestResults(results, 'rate-limit-test-results.json');
            console.log(`💾 Results saved to: ${savedFile}`);
        } catch (error) {
            console.error('❌ Failed to save results:', error.message);
        }
        
        // Exit with appropriate code
        const allPassed = results.passedTests === results.totalTests;
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Rate limit tests failed:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Rate limit tests interrupted');
    process.exit(0);
});

// Run the tests
if (require.main === module) {
    runRateLimitTests();
}

module.exports = { RateLimitTestSystem, runRateLimitTests }; 