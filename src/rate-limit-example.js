const RateLimiterMiddleware = require('./middleware/rateLimiter');
const { getRateLimitStatus, updateRateLimitAfterMessage } = require('./utils/rateLimitUtils');
const RateLimit = require('./models/RateLimit');

// Example usage of the advanced rate limiting system

async function demonstrateRateLimiting() {
  console.log('🚀 Advanced Rate Limiting System Demo\n');

  // Create rate limiter middleware
  const rateLimiter = new RateLimiterMiddleware({
    baseInterval: 30000,    // 30 seconds
    jitterRange: 10000,     // ±10 seconds
    enableWarnings: true,
    enableLogging: true,
    strictMode: false
  });

  const connectionId = 'demo-connection-123';

  // Example 1: Check rate limit status
  console.log('📊 Example 1: Checking rate limit status');
  try {
    const status = await getRateLimitStatus(connectionId);
    console.log('Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
  console.log('');

  // Example 2: Simulate sending messages
  console.log('📤 Example 2: Simulating message sending');
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`\n--- Message ${i}/5 ---`);
      
      // Check if we can send
      const status = await getRateLimitStatus(connectionId);
      console.log(`Can send: ${status.canSend}`);
      console.log(`Status: ${status.status}`);
      console.log(`Daily count: ${status.stats.dailyMessageCount}/${status.stats.dailyLimit}`);
      
      if (status.canSend) {
        // Simulate sending message
        console.log('✅ Sending message...');
        const updateResult = await updateRateLimitAfterMessage(connectionId);
        console.log(`Next allowed time: ${updateResult.nextAllowedTime.toLocaleTimeString()}`);
        console.log(`Current interval: ${updateResult.stats.currentInterval}ms`);
      } else {
        console.log(`❌ Cannot send: ${status.reason}`);
        console.log(`Wait time: ${Math.ceil(status.delay / 1000)} seconds`);
      }
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error in message ${i}:`, error.message);
    }
  }
  console.log('');

  // Example 3: Get final status
  console.log('📈 Example 3: Final rate limit status');
  try {
    const finalStatus = await getRateLimitStatus(connectionId);
    console.log('Final Status:', JSON.stringify(finalStatus, null, 2));
  } catch (error) {
    console.error('Error getting final status:', error.message);
  }
  console.log('');

  // Example 4: Demonstrate warnings
  console.log('⚠️ Example 4: Warning threshold demonstration');
  try {
    const rateLimit = await RateLimit.findOne({ connectionId });
    if (rateLimit) {
      const percentageUsed = (rateLimit.dailyMessageCount / rateLimit.rateLimitConfig.dailyLimit) * 100;
      console.log(`Daily messages used: ${percentageUsed.toFixed(2)}%`);
      
      if (rateLimit.status === 'warning') {
        console.log('⚠️ Connection is in warning state!');
        console.log(`Daily limit: ${rateLimit.rateLimitConfig.dailyLimit}`);
        console.log(`Warning threshold: ${rateLimit.rateLimitConfig.warningThreshold}`);
        console.log(`Current count: ${rateLimit.dailyMessageCount}`);
      }
    }
  } catch (error) {
    console.error('Error checking warnings:', error.message);
  }
  console.log('');

  // Example 5: Demonstrate Express middleware usage
  console.log('🌐 Example 5: Express middleware usage');
  console.log(`
// In your Express app:

const rateLimiter = new RateLimiterMiddleware({
  baseInterval: 30000,
  jitterRange: 10000,
  enableWarnings: true,
  enableLogging: true
});

const { rateLimit, updateRateLimit, router } = rateLimiter.createMiddleware();

// Apply rate limiting to message sending routes
app.post('/api/send-message', 
  rateLimit,           // Check rate limit before sending
  sendMessageHandler,  // Your message sending logic
  updateRateLimit      // Update rate limit after sending
);

// Add rate limit management endpoints
app.use('/api/rate-limit', router);

// Available endpoints:
// GET /api/rate-limit/status/:connectionId
// POST /api/rate-limit/pause/:connectionId
// POST /api/rate-limit/resume/:connectionId
// POST /api/rate-limit/reset/:connectionId
`);

  // Example 6: Database statistics
  console.log('📊 Example 6: Database statistics');
  try {
    const dailyStats = await RateLimit.getDailyStats();
    console.log('Daily Statistics:', JSON.stringify(dailyStats, null, 2));
    
    const warningConnections = await RateLimit.getWarningConnections();
    const blockedConnections = await RateLimit.getBlockedConnections();
    
    console.log(`Connections with warnings: ${warningConnections.length}`);
    console.log(`Blocked connections: ${blockedConnections.length}`);
    
  } catch (error) {
    console.error('Error getting statistics:', error.message);
  }
  console.log('');

  console.log('✅ Rate limiting demonstration completed!');
}

// Error handling demonstration
async function demonstrateErrorHandling() {
  console.log('🚨 Error Handling Examples:\n');

  // Example: Invalid connection ID
  try {
    const status = await getRateLimitStatus('');
    console.log('This should not print');
  } catch (error) {
    console.log('✅ Caught error for invalid connection ID:', error.message);
  }

  // Example: Database connection error (simulated)
  try {
    // This would fail if MongoDB is not connected
    const rateLimit = new RateLimit({ connectionId: 'test' });
    await rateLimit.save();
  } catch (error) {
    console.log('✅ Caught database error:', error.message);
  }
}

// Performance demonstration
async function demonstratePerformance() {
  console.log('⚡ Performance Demonstration:\n');

  const connectionIds = [
    'connection-1', 'connection-2', 'connection-3', 
    'connection-4', 'connection-5'
  ];

  console.log('Testing rate limit checks for multiple connections...');
  
  const startTime = Date.now();
  
  // Simulate concurrent rate limit checks
  const promises = connectionIds.map(async (connectionId) => {
    try {
      const status = await getRateLimitStatus(connectionId);
      return { connectionId, success: true, status: status.status };
    } catch (error) {
      return { connectionId, success: false, error: error.message };
    }
  });

  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`Completed ${results.length} checks in ${endTime - startTime}ms`);
  console.log('Results:', results);
}

// Main execution
async function main() {
  try {
    await demonstrateRateLimiting();
    console.log('\n' + '='.repeat(60) + '\n');
    await demonstrateErrorHandling();
    console.log('\n' + '='.repeat(60) + '\n');
    await demonstratePerformance();
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  }
}

// Export for use in other files
module.exports = {
  demonstrateRateLimiting,
  demonstrateErrorHandling,
  demonstratePerformance
};

// Run if this file is executed directly
if (require.main === module) {
  main();
} 