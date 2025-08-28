const queueService = require('./services/queueService');
const { initializeMessageWorker } = require('./workers/messageWorker');

// Example usage of the WhatsApp message queue system

async function exampleUsage() {
  console.log('🚀 Starting WhatsApp Message Queue Example...\n');

  // Initialize the message worker
  initializeMessageWorker();

  // Example 1: Add a single message
  console.log('📝 Example 1: Adding a single message');
  const result1 = await queueService.addMessage(
    'connection-123',
    'Hello! This is a test message from ChatGrow.',
    '972501234567',
    'normal'
  );
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('');

  // Example 2: Add message to multiple recipients
  console.log('📝 Example 2: Adding message to multiple recipients');
  const result2 = await queueService.addMessage(
    'connection-123',
    'Bulk message test from ChatGrow!',
    ['972501234567', '972507654321', '972509876543'],
    'high'
  );
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('');

  // Example 3: Get queue status
  console.log('📊 Example 3: Getting queue status');
  const status = await queueService.getQueueStatus('connection-123');
  console.log('Status:', JSON.stringify(status, null, 2));
  console.log('');

  // Example 4: Pause queue
  console.log('⏸️ Example 4: Pausing queue');
  const pauseResult = await queueService.pauseQueue('connection-123');
  console.log('Pause Result:', JSON.stringify(pauseResult, null, 2));
  console.log('');

  // Example 5: Resume queue
  console.log('▶️ Example 5: Resuming queue');
  const resumeResult = await queueService.resumeQueue('connection-123');
  console.log('Resume Result:', JSON.stringify(resumeResult, null, 2));
  console.log('');

  // Example 6: Get overall statistics
  console.log('📈 Example 6: Getting queue statistics');
  const stats = await queueService.getQueueStatistics();
  console.log('Statistics:', JSON.stringify(stats, null, 2));
  console.log('');

  // Example 7: Clear failed jobs
  console.log('🧹 Example 7: Clearing failed jobs');
  const clearResult = await queueService.clearFailedJobs('connection-123');
  console.log('Clear Result:', JSON.stringify(clearResult, null, 2));
  console.log('');

  console.log('✅ Example completed!');
}

// Error handling example
async function errorHandlingExample() {
  console.log('🚨 Error Handling Examples:\n');

  // Example: Invalid connection ID
  try {
    const result = await queueService.addMessage(
      '', // Invalid empty connection ID
      'Test message',
      '972501234567'
    );
    console.log('This should not print');
  } catch (error) {
    console.log('✅ Caught error for invalid connection ID:', error.message);
  }

  // Example: Invalid recipients
  try {
    const result = await queueService.addMessage(
      'connection-123',
      'Test message',
      [] // Empty recipients array
    );
    console.log('This should not print');
  } catch (error) {
    console.log('✅ Caught error for invalid recipients:', error.message);
  }

  // Example: Invalid priority
  try {
    const result = await queueService.addMessage(
      'connection-123',
      'Test message',
      '972501234567',
      'invalid-priority' // Invalid priority
    );
    console.log('This should not print');
  } catch (error) {
    console.log('✅ Caught error for invalid priority:', error.message);
  }
}

// Rate limiting demonstration
async function rateLimitingDemo() {
  console.log('⏱️ Rate Limiting Demonstration:\n');

  const connectionId = 'connection-rate-test';
  const message = 'Rate limit test message';

  // Send multiple messages quickly to see rate limiting in action
  for (let i = 1; i <= 5; i++) {
    console.log(`📤 Sending message ${i}/5...`);
    const result = await queueService.addMessage(
      connectionId,
      `${message} #${i}`,
      '972501234567'
    );
    
    console.log(`Message ${i} queued with delay: ${result.delay}ms`);
    console.log(`Estimated send time: ${new Date(result.estimatedSendTime).toLocaleTimeString()}`);
    console.log('');
  }

  // Get status to see rate limiting info
  const status = await queueService.getQueueStatus(connectionId);
  console.log('Rate limiting status:', JSON.stringify(status, null, 2));
}

// Main execution
async function main() {
  try {
    await exampleUsage();
    console.log('\n' + '='.repeat(50) + '\n');
    await errorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    await rateLimitingDemo();
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  }
}

// Export for use in other files
module.exports = {
  exampleUsage,
  errorHandlingExample,
  rateLimitingDemo
};

// Run if this file is executed directly
if (require.main === module) {
  main();
} 