# WhatsApp Message Queue System

A robust Bull Queue system for managing WhatsApp messages with rate limiting, error handling, and monitoring capabilities.

## 🏗️ Architecture

```
src/
├── queues/
│   └── messageQueue.js      # Core queue configuration and Redis connection
├── services/
│   └── queueService.js      # High-level service for queue operations
├── workers/
│   └── messageWorker.js     # Message processing workers
├── example-usage.js         # Usage examples and demonstrations
└── README.md               # This file
```

## 🚀 Features

### ✅ **Rate Limiting**
- **Base interval**: 30 seconds between messages per connection
- **Maximum interval**: 45 seconds with random jitter
- **Jitter range**: 0-15 seconds to avoid detection
- **Per-connection tracking**: Each WhatsApp connection has its own rate limiter

### ✅ **Queue Management**
- **Priority levels**: High, Normal, Low
- **Job persistence**: Redis-backed with configurable retention
- **Retry logic**: Exponential backoff with 3 attempts
- **Concurrency control**: 5 concurrent workers

### ✅ **Error Handling**
- **Comprehensive logging**: Winston logger with file and console output
- **Graceful failures**: Failed jobs are logged and can be retried
- **Connection validation**: Checks WhatsApp client status before sending
- **Input validation**: Validates all parameters before queueing

### ✅ **Monitoring & Control**
- **Queue status**: Real-time status per connection
- **Statistics**: Overall queue performance metrics
- **Pause/Resume**: Control queue processing per connection
- **Failed job management**: Clear failed jobs for specific connections

## 📦 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables** (copy from `env.example`):
```bash
cp env.example .env
```

3. **Configure Redis**:
```bash
# Make sure Redis is running
redis-server
```

## 🔧 Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Configuration
NODE_ENV=development
```

### Rate Limiting Settings
```javascript
// In src/queues/messageQueue.js
const RATE_LIMIT_BASE = 30000; // 30 seconds base
const RATE_LIMIT_MAX = 45000;  // 45 seconds max
const JITTER_RANGE = 15000;    // 15 seconds jitter range
```

## 📖 Usage

### Basic Usage

```javascript
const queueService = require('./services/queueService');

// Add a message to the queue
const result = await queueService.addMessage(
  'connection-123',           // WhatsApp connection ID
  'Hello from ChatGrow!',     // Message content
  '972501234567',            // Recipient phone number
  'normal'                    // Priority: 'high', 'normal', 'low'
);

console.log(result);
// {
//   success: true,
//   jobId: 'connection-123-1234567890-abc123',
//   delay: 0,
//   estimatedSendTime: 1234567890000,
//   recipientsCount: 1,
//   message: 'Message queued successfully'
// }
```

### Multiple Recipients

```javascript
const result = await queueService.addMessage(
  'connection-123',
  'Bulk message test!',
  ['972501234567', '972507654321', '972509876543'],
  'high'
);
```

### Queue Management

```javascript
// Get queue status
const status = await queueService.getQueueStatus('connection-123');

// Pause queue
await queueService.pauseQueue('connection-123');

// Resume queue
await queueService.resumeQueue('connection-123');

// Get statistics
const stats = await queueService.getQueueStatistics();

// Clear failed jobs
await queueService.clearFailedJobs('connection-123');
```

## 🔄 Worker Setup

### Initialize Workers

```javascript
const { initializeMessageWorker } = require('./workers/messageWorker');

// Start the message processing workers
initializeMessageWorker();
```

### WhatsApp Integration

You need to implement the `WhatsAppClientManager` in `src/workers/messageWorker.js`:

```javascript
class WhatsAppClientManager {
  constructor() {
    this.clients = new Map(); // connectionId -> client
  }

  async getClient(connectionId) {
    // Return your WhatsApp client instance
    return this.clients.get(connectionId);
  }

  async sendMessage(client, recipient, message) {
    // Send the actual WhatsApp message
    return await client.sendMessage(recipient, message);
  }

  async isClientConnected(connectionId) {
    const client = this.clients.get(connectionId);
    return client && client.isConnected;
  }
}
```

## 📊 Monitoring

### Queue Status Response
```javascript
{
  connectionId: 'connection-123',
  totalJobs: 5,
  waiting: 2,
  active: 1,
  delayed: 1,
  failed: 1,
  timeUntilNextAllowed: 15000,
  isPaused: false,
  status: 'active',
  rateLimitInfo: {
    lastMessage: 1234567890000,
    interval: 35000,
    nextAllowedTime: 1234567925000
  },
  lastUpdated: '2024-01-01T12:00:00.000Z'
}
```

### Statistics Response
```javascript
{
  total: 100,
  waiting: 10,
  active: 5,
  completed: 80,
  failed: 3,
  delayed: 2,
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

## 🚨 Error Handling

### Common Errors

1. **Queue Paused**: `Queue is paused for connection: connection-123`
2. **Client Not Connected**: `WhatsApp client not connected`
3. **Invalid Parameters**: `Missing required parameters: connectionId, message, recipients`
4. **Rate Limited**: Messages are automatically delayed based on rate limiting

### Error Response Format
```javascript
{
  success: false,
  error: 'Error message here',
  message: 'User-friendly message'
}
```

## 🧪 Testing

Run the example usage:

```bash
node src/example-usage.js
```

This will demonstrate:
- Adding messages to the queue
- Rate limiting behavior
- Error handling
- Queue management operations

## 📝 Logging

Logs are written to:
- `logs/queue-error.log` - Error level logs
- `logs/queue-combined.log` - All logs
- Console - Development output

### Log Format
```javascript
{
  level: 'info',
  message: 'Message queued successfully',
  timestamp: '2024-01-01T12:00:00.000Z',
  service: 'message-queue',
  connectionId: 'connection-123',
  jobId: 'job-123',
  recipientsCount: 1
}
```

## 🔧 Customization

### Modify Rate Limiting
Edit the constants in `src/queues/messageQueue.js`:
```javascript
const RATE_LIMIT_BASE = 30000; // Change base interval
const RATE_LIMIT_MAX = 45000;  // Change max interval
const JITTER_RANGE = 15000;    // Change jitter range
```

### Change Worker Concurrency
In `src/workers/messageWorker.js`:
```javascript
messageQueue.process('send-message', 5, processMessageWithRetry);
// Change 5 to your desired concurrency level
```

### Modify Job Options
In `src/queues/messageQueue.js`:
```javascript
defaultJobOptions: {
  removeOnComplete: 10,  // Keep 10 completed jobs
  removeOnFail: 5,       // Keep 5 failed jobs
  attempts: 3,           // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 2000
  }
}
```

## 🚀 Production Deployment

1. **Set environment variables**:
```env
NODE_ENV=production
REDIS_URL=redis://your-redis-server:6379
```

2. **Start workers**:
```bash
node src/workers/messageWorker.js
```

3. **Monitor logs**:
```bash
tail -f logs/queue-combined.log
```

4. **Health checks**:
```javascript
const stats = await queueService.getQueueStatistics();
if (stats.data.failed > 10) {
  // Alert: Too many failed jobs
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License 