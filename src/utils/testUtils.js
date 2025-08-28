const { logInfo, logError, logDebug } = require('./logger');

/**
 * Create test contacts for load testing
 * @param {number} count - Number of test contacts to create
 * @returns {Array} Array of test contact objects
 */
async function createTestContacts(count) {
    const contacts = [];
    
    for (let i = 1; i <= count; i++) {
        // Generate realistic phone numbers for testing
        const countryCode = '+972'; // Israel
        const areaCode = Math.floor(Math.random() * 900) + 50; // 50-949
        const phoneNumber = Math.floor(Math.random() * 9000000) + 1000000; // 7 digits
        
        const phone = `${countryCode}${areaCode}${phoneNumber}`;
        
        contacts.push({
            id: `test-contact-${i}`,
            phone: phone,
            name: `Test Contact ${i}`,
            email: `test${i}@example.com`,
            isTestContact: true,
            createdAt: new Date()
        });
    }
    
    logDebug(`Created ${count} test contacts`);
    return contacts;
}

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {Array} args - Arguments to pass to the function
 * @returns {Object} Object containing result and execution time
 */
async function measureTime(fn, ...args) {
    const startTime = process.hrtime.bigint();
    
    try {
        const result = await fn(...args);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        return {
            success: true,
            result,
            executionTime,
            error: null
        };
    } catch (error) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        
        return {
            success: false,
            result: null,
            executionTime,
            error: error.message
        };
    }
}

/**
 * Calculate comprehensive statistics from test results
 * @param {Array} data - Array of data points
 * @param {string} key - Key to calculate statistics for (if data contains objects)
 * @returns {Object} Statistics object
 */
function calculateStatistics(data, key = null) {
    if (!Array.isArray(data) || data.length === 0) {
        return {
            count: 0,
            min: 0,
            max: 0,
            mean: 0,
            median: 0,
            p95: 0,
            p99: 0,
            standardDeviation: 0
        };
    }
    
    // Extract values if data contains objects
    const values = key ? data.map(item => item[key]).filter(v => typeof v === 'number') : data.filter(v => typeof v === 'number');
    
    if (values.length === 0) {
        return {
            count: 0,
            min: 0,
            max: 0,
            mean: 0,
            median: 0,
            p95: 0,
            p99: 0,
            standardDeviation: 0
        };
    }
    
    // Sort values for percentile calculations
    values.sort((a, b) => a - b);
    
    const count = values.length;
    const min = values[0];
    const max = values[count - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;
    
    // Calculate median
    const median = count % 2 === 0 
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];
    
    // Calculate percentiles
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const p95 = values[p95Index];
    const p99 = values[p99Index];
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    
    return {
        count,
        min,
        max,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        p99: Math.round(p99 * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100
    };
}

/**
 * Generate a comprehensive test report
 * @param {Object} testResults - Test results object
 * @returns {Object} Formatted report
 */
function generateTestReport(testResults) {
    const {
        testId,
        startTime,
        endTime,
        totalMessages,
        successfulMessages,
        failedMessages,
        blockedMessages,
        deliveryRate,
        banRate,
        averageTimePerMessage,
        totalTime,
        errors,
        warnings,
        recommendations,
        performanceMetrics
    } = testResults;
    
    // Calculate additional metrics
    const errorRate = (errors.length / totalMessages) * 100;
    const warningCount = warnings.length;
    const criticalRecommendations = recommendations.filter(r => r.priority === 'CRITICAL').length;
    const highPriorityRecommendations = recommendations.filter(r => r.priority === 'HIGH').length;
    
    // Performance analysis
    const performanceStats = calculateStatistics(performanceMetrics.times || []);
    
    // Test duration
    const duration = endTime ? (endTime - startTime) / 1000 : 0; // in seconds
    
    // Throughput calculation
    const throughput = duration > 0 ? (successfulMessages / duration) : 0; // messages per second
    
    const report = {
        summary: {
            testId,
            status: deliveryRate >= 98 && banRate <= 0.5 ? 'PASSED' : 'FAILED',
            startTime: startTime.toISOString(),
            endTime: endTime ? endTime.toISOString() : null,
            duration: `${Math.round(duration)}s`,
            totalMessages,
            successfulMessages,
            failedMessages,
            blockedMessages
        },
        metrics: {
            deliveryRate: `${deliveryRate.toFixed(2)}%`,
            banRate: `${banRate.toFixed(2)}%`,
            errorRate: `${errorRate.toFixed(2)}%`,
            averageTimePerMessage: `${Math.round(averageTimePerMessage)}ms`,
            throughput: `${throughput.toFixed(2)} msg/s`,
            totalTime: `${Math.round(totalTime)}ms`
        },
        performance: {
            statistics: performanceStats,
            percentiles: {
                p50: `${performanceMetrics.medianTime}ms`,
                p95: `${performanceMetrics.p95Time}ms`,
                p99: `${performanceMetrics.p99Time}ms`
            }
        },
        issues: {
            errors: errors.length,
            warnings: warningCount,
            criticalRecommendations,
            highPriorityRecommendations
        },
        recommendations: recommendations.map(rec => ({
            priority: rec.priority,
            type: rec.type,
            message: rec.message
        })),
        details: {
            errors: errors.slice(0, 10), // Show first 10 errors
            warnings: warnings.slice(0, 10), // Show first 10 warnings
            performanceMetrics
        }
    };
    
    return report;
}

/**
 * Validate test configuration
 * @param {Object} config - Test configuration
 * @returns {Object} Validation result
 */
function validateTestConfig(config) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!config.messageCount || config.messageCount <= 0) {
        errors.push('messageCount must be a positive number');
    }
    
    if (!config.connectionId) {
        errors.push('connectionId is required');
    }
    
    // Validation rules
    if (config.messageCount > 1000) {
        warnings.push('Large message count may take significant time to complete');
    }
    
    if (config.delayBetweenMessages < 100) {
        warnings.push('Very low delay between messages may trigger rate limiting');
    }
    
    if (config.maxConcurrentMessages > 20) {
        warnings.push('High concurrency may overwhelm the system');
    }
    
    // Performance thresholds
    if (config.delayBetweenMessages < 500) {
        warnings.push('Delay less than 500ms may not provide realistic testing conditions');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Create test data for different scenarios
 * @param {string} scenario - Test scenario
 * @param {number} count - Number of test items
 * @returns {Array} Test data array
 */
function createTestData(scenario, count) {
    switch (scenario) {
        case 'normal':
            return createNormalTestData(count);
        case 'stress':
            return createStressTestData(count);
        case 'spike':
            return createSpikeTestData(count);
        case 'gradual':
            return createGradualTestData(count);
        default:
            return createNormalTestData(count);
    }
}

function createNormalTestData(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: `normal-${i + 1}`,
        priority: 'normal',
        delay: 1000 + Math.random() * 2000, // 1-3 seconds
        retryCount: 0
    }));
}

function createStressTestData(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: `stress-${i + 1}`,
        priority: 'high',
        delay: 100 + Math.random() * 500, // 100-600ms
        retryCount: 0
    }));
}

function createSpikeTestData(count) {
    const spikeSize = Math.floor(count * 0.2); // 20% spike
    const normalSize = count - spikeSize;
    
    const normal = Array.from({ length: normalSize }, (_, i) => ({
        id: `spike-normal-${i + 1}`,
        priority: 'normal',
        delay: 1000 + Math.random() * 2000,
        retryCount: 0
    }));
    
    const spike = Array.from({ length: spikeSize }, (_, i) => ({
        id: `spike-burst-${i + 1}`,
        priority: 'high',
        delay: 50 + Math.random() * 100, // 50-150ms
        retryCount: 0
    }));
    
    return [...normal, ...spike];
}

function createGradualTestData(count) {
    return Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        const delay = 500 + progress * 2000; // Gradually increase from 500ms to 2.5s
        
        return {
            id: `gradual-${i + 1}`,
            priority: 'normal',
            delay: delay + Math.random() * 500,
            retryCount: 0
        };
    });
}

/**
 * Format test results for display
 * @param {Object} results - Test results
 * @returns {string} Formatted string
 */
function formatTestResults(results) {
    const report = generateTestReport(results);
    
    let output = `
╔══════════════════════════════════════════════════════════════╗
║                    CHATGROW LOAD TEST REPORT                 ║
╚══════════════════════════════════════════════════════════════╝

📊 SUMMARY
   Test ID: ${report.summary.testId}
   Status: ${report.summary.status}
   Duration: ${report.summary.duration}
   Total Messages: ${report.summary.totalMessages}
   Successful: ${report.summary.successfulMessages}
   Failed: ${report.summary.failedMessages}
   Blocked: ${report.summary.blockedMessages}

📈 METRICS
   Delivery Rate: ${report.metrics.deliveryRate}
   Ban Rate: ${report.metrics.banRate}
   Error Rate: ${report.metrics.errorRate}
   Avg Time/Message: ${report.metrics.averageTimePerMessage}
   Throughput: ${report.metrics.throughput}

⚡ PERFORMANCE
   Min Time: ${report.performance.statistics.min}ms
   Max Time: ${report.performance.statistics.max}ms
   Median (P50): ${report.performance.percentiles.p50}
   95th Percentile: ${report.performance.percentiles.p95}
   99th Percentile: ${report.performance.percentiles.p99}

⚠️  ISSUES
   Errors: ${report.issues.errors}
   Warnings: ${report.issues.warnings}
   Critical Recommendations: ${report.issues.criticalRecommendations}
   High Priority Recommendations: ${report.issues.highPriorityRecommendations}

💡 RECOMMENDATIONS
`;
    
    if (report.recommendations.length === 0) {
        output += '   ✅ No recommendations - system performing well!\n';
    } else {
        report.recommendations.forEach(rec => {
            const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : 'ℹ️';
            output += `   ${priorityIcon} ${rec.message}\n`;
        });
    }
    
    output += '\n' + '═'.repeat(70) + '\n';
    
    return output;
}

/**
 * Save test results to file
 * @param {Object} results - Test results
 * @param {string} filename - Output filename
 */
async function saveTestResults(results, filename = null) {
    const fs = require('fs').promises;
    const path = require('path');
    
    if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `load-test-results-${timestamp}.json`;
    }
    
    const outputDir = path.join(process.cwd(), 'test-results');
    
    try {
        // Create output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        
        const filepath = path.join(outputDir, filename);
        const report = generateTestReport(results);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        
        logInfo(`Test results saved to ${filepath}`);
        return filepath;
    } catch (error) {
        logError('Failed to save test results', { error: error.message });
        throw error;
    }
}

module.exports = {
    createTestContacts,
    measureTime,
    calculateStatistics,
    generateTestReport,
    validateTestConfig,
    createTestData,
    formatTestResults,
    saveTestResults
}; 