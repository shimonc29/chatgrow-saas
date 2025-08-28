#!/usr/bin/env node

const loadTestSystem = require('./loadTest');
const { formatTestResults, saveTestResults, validateTestConfig } = require('../utils/testUtils');
const { logInfo, logError, logWarning } = require('../utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

// Default configuration
const defaultConfig = {
    messageCount: 500,
    connectionId: 'test-connection',
    messageTemplate: 'Test message #{number} from ChatGrow Load Test',
    delayBetweenMessages: 1000,
    maxConcurrentMessages: 5,
    testDuration: 300000,
    enableRateLimiting: true,
    enableLogging: true,
    enableHealthChecks: true,
    saveResults: true,
    outputFormat: 'console'
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
        case '--help':
        case '-h':
            showHelp();
            process.exit(0);
            break;
            
        case '--count':
        case '-c':
            options.messageCount = parseInt(args[++i]);
            break;
            
        case '--connection':
        case '-conn':
            options.connectionId = args[++i];
            break;
            
        case '--delay':
        case '-d':
            options.delayBetweenMessages = parseInt(args[++i]);
            break;
            
        case '--concurrent':
        case '-cc':
            options.maxConcurrentMessages = parseInt(args[++i]);
            break;
            
        case '--template':
        case '-t':
            options.messageTemplate = args[++i];
            break;
            
        case '--duration':
        case '-dur':
            options.testDuration = parseInt(args[++i]);
            break;
            
        case '--no-rate-limit':
            options.enableRateLimiting = false;
            break;
            
        case '--no-logging':
            options.enableLogging = false;
            break;
            
        case '--no-health':
            options.enableHealthChecks = false;
            break;
            
        case '--save':
            options.saveResults = true;
            break;
            
        case '--no-save':
            options.saveResults = false;
            break;
            
        case '--output':
        case '-o':
            options.outputFormat = args[++i];
            break;
            
        case '--json':
            options.outputFormat = 'json';
            break;
            
        case '--quiet':
        case '-q':
            options.quiet = true;
            break;
            
        case '--verbose':
        case '-v':
            options.verbose = true;
            break;
    }
}

// Merge with defaults
const config = { ...defaultConfig, ...options };

function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    CHATGROW LOAD TEST RUNNER                 ║
╚══════════════════════════════════════════════════════════════╝

Usage: npm run test:load [options]

Options:
  -h, --help                    Show this help message
  -c, --count <number>          Number of messages to send (default: 500)
  -conn, --connection <id>      Connection ID to use (default: test-connection)
  -d, --delay <ms>              Delay between messages in ms (default: 1000)
  -cc, --concurrent <number>    Max concurrent messages (default: 5)
  -t, --template <string>       Message template (default: "Test message #{number}...")
  -dur, --duration <ms>         Test duration limit in ms (default: 300000)
  --no-rate-limit               Disable rate limiting
  --no-logging                  Disable logging
  --no-health                   Disable health checks
  --save                        Save results to file (default: true)
  --no-save                     Don't save results to file
  -o, --output <format>         Output format: console, json, both (default: console)
  --json                        Output results as JSON
  -q, --quiet                   Quiet mode (minimal output)
  -v, --verbose                 Verbose mode (detailed output)

Examples:
  npm run test:load
  npm run test:load --count 1000 --delay 500
  npm run test:load --connection my-connection --concurrent 10
  npm run test:load --json --save
  npm run test:load --no-rate-limit --verbose

Pass Conditions:
  ✅ Delivery Rate ≥ 98%
  ✅ Ban Rate ≤ 0.5%
  ✅ No crashes
`);
}

async function runLoadTest() {
    try {
        // Validate configuration
        const validation = validateTestConfig(config);
        if (!validation.isValid) {
            console.error('❌ Configuration validation failed:');
            validation.errors.forEach(error => console.error(`   - ${error}`));
            process.exit(1);
        }
        
        if (validation.warnings.length > 0) {
            console.warn('⚠️  Configuration warnings:');
            validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
        }
        
        if (!config.quiet) {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    STARTING LOAD TEST                        ║
╚══════════════════════════════════════════════════════════════╝

📋 Configuration:
   Messages: ${config.messageCount}
   Connection: ${config.connectionId}
   Delay: ${config.delayBetweenMessages}ms
   Concurrent: ${config.maxConcurrentMessages}
   Duration: ${config.testDuration}ms
   Rate Limiting: ${config.enableRateLimiting ? 'Enabled' : 'Disabled'}
   Health Checks: ${config.enableHealthChecks ? 'Enabled' : 'Disabled'}
   Logging: ${config.enableLogging ? 'Enabled' : 'Disabled'}

🚀 Initializing test system...
`);
        }
        
        // Initialize load test system
        await loadTestSystem.init();
        
        if (!config.quiet) {
            console.log('✅ Load test system initialized');
            console.log('🔄 Starting test...\n');
        }
        
        // Run the load test
        const startTime = Date.now();
        const results = await loadTestSystem.runLoadTest(config);
        const endTime = Date.now();
        
        if (!config.quiet) {
            console.log('\n✅ Load test completed!');
            console.log(`⏱️  Total time: ${Math.round((endTime - startTime) / 1000)}s\n`);
        }
        
        // Format and display results
        if (config.outputFormat === 'console' || config.outputFormat === 'both') {
            const formattedResults = formatTestResults(results);
            console.log(formattedResults);
        }
        
        if (config.outputFormat === 'json' || config.outputFormat === 'both') {
            console.log(JSON.stringify(results, null, 2));
        }
        
        // Save results if requested
        if (config.saveResults) {
            try {
                const savedFile = await saveTestResults(results);
                if (!config.quiet) {
                    console.log(`💾 Results saved to: ${savedFile}`);
                }
            } catch (error) {
                logError('Failed to save results', { error: error.message });
                if (!config.quiet) {
                    console.error('❌ Failed to save results to file');
                }
            }
        }
        
        // Check pass conditions
        const passed = checkPassConditions(results);
        
        if (!config.quiet) {
            console.log('\n' + '═'.repeat(70));
            if (passed) {
                console.log('🎉 LOAD TEST PASSED - All conditions met!');
            } else {
                console.log('❌ LOAD TEST FAILED - Some conditions not met');
            }
            console.log('═'.repeat(70) + '\n');
        }
        
        // Exit with appropriate code
        process.exit(passed ? 0 : 1);
        
    } catch (error) {
        logError('Load test runner failed', { error: error.message, stack: error.stack });
        
        if (!config.quiet) {
            console.error('\n❌ Load test failed with error:');
            console.error(error.message);
            
            if (config.verbose) {
                console.error('\nStack trace:');
                console.error(error.stack);
            }
        }
        
        process.exit(1);
    } finally {
        // Cleanup
        try {
            await loadTestSystem.cleanup();
        } catch (error) {
            logError('Error during cleanup', { error: error.message });
        }
    }
}

function checkPassConditions(results) {
    const conditions = [
        {
            name: 'Delivery Rate ≥ 98%',
            passed: results.deliveryRate >= 98,
            value: `${results.deliveryRate.toFixed(2)}%`
        },
        {
            name: 'Ban Rate ≤ 0.5%',
            passed: results.banRate <= 0.5,
            value: `${results.banRate.toFixed(2)}%`
        },
        {
            name: 'No Crashes',
            passed: results.errors.filter(e => e.type === 'TEST_FAILURE').length === 0,
            value: results.errors.filter(e => e.type === 'TEST_FAILURE').length === 0 ? 'No crashes' : 'Crashes detected'
        }
    ];
    
    if (!config.quiet) {
        console.log('📊 Pass Conditions Check:');
        conditions.forEach(condition => {
            const icon = condition.passed ? '✅' : '❌';
            console.log(`   ${icon} ${condition.name}: ${condition.value}`);
        });
    }
    
    return conditions.every(c => c.passed);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, stopping test...');
    await loadTestSystem.stopTest();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received termination signal, stopping test...');
    await loadTestSystem.stopTest();
    process.exit(0);
});

// Run the load test
if (require.main === module) {
    runLoadTest();
}

module.exports = { runLoadTest, checkPassConditions }; 