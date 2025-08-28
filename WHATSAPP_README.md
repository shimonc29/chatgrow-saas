# 📱 WhatsApp Integration System

## 🎯 מטרה

מערכת אינטגרציה מתקדמת עם WhatsApp המאפשרת:
- **ניהול חיבורים מרובים** - תמיכה במספר חיבורי WhatsApp במקביל
- **אימות QR Code** - חיבור מאובטח באמצעות סריקת QR
- **שליחת הודעות** - תמיכה בהודעות טקסט ומדיה
- **ניהול תורים** - עיבוד הודעות עם retry logic מתקדם
- **ניטור בריאות** - מעקב אחר חיבורים וסטטיסטיקות
- **אבטחה מתקדמת** - הגבלת קצב, אימות משתמשים, ולוגים מקיפים

## 🏗️ ארכיטקטורה

```
📱 WhatsApp Integration
├── 🔗 Connection Management
│   ├── Multiple connections per user
│   ├── QR code authentication
│   ├── Session persistence
│   └── Auto-reconnection
├── 📨 Message Processing
│   ├── Queue-based processing
│   ├── Retry logic with backoff
│   ├── Rate limiting per connection
│   └── Bulk messaging support
├── 🛡️ Security & Monitoring
│   ├── User authentication
│   ├── Connection health checks
│   ├── Comprehensive logging
│   └── Error handling
└── 🔌 API Integration
    ├── RESTful endpoints
    ├── Webhook support
    ├── Real-time status
    └── Statistics & reporting
```

## 📦 התקנה

### 1. התקנת תלויות

```bash
npm install whatsapp-web.js qrcode puppeteer
```

### 2. הגדרת משתני סביבה

```env
# WhatsApp Configuration
WHATSAPP_SESSION_DIR=./sessions
WHATSAPP_MAX_CONNECTIONS=10
WHATSAPP_HEALTH_CHECK_INTERVAL=60000

# Puppeteer Configuration (for WhatsApp Web)
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
```

### 3. יצירת תיקיות נדרשות

```bash
mkdir -p sessions logs
```

## 🚀 שימוש מהיר

### 1. יצירת חיבור WhatsApp

```javascript
const whatsAppService = require('./services/whatsappService');

// Create a new connection
const connection = await whatsAppService.createConnection(
    userId,
    'my_connection_123',
    {
        name: 'Business WhatsApp',
        phoneNumber: '+972501234567',
        settings: {
            autoReconnect: true,
            maxReconnectAttempts: 5
        }
    }
);
```

### 2. קבלת QR Code לאימות

```javascript
// Get QR code for authentication
const qrData = await whatsAppService.getQRCode('my_connection_123');
console.log('QR Code:', qrData.qrCode);
```

### 3. שליחת הודעה

```javascript
// Send a message
const result = await whatsAppService.sendMessage(
    'my_connection_123',
    '+972501234567',
    'Hello from ChatGrow!',
    { priority: 'normal' }
);
```

## 🔌 API Endpoints

### Connection Management

#### יצירת חיבור חדש
```http
POST /api/whatsapp/connections
Authorization: Bearer <token>
Content-Type: application/json

{
    "connectionId": "my_connection_123",
    "name": "Business WhatsApp",
    "phoneNumber": "+972501234567",
    "settings": {
        "autoReconnect": true,
        "maxReconnectAttempts": 5
    }
}
```

#### קבלת QR Code
```http
GET /api/whatsapp/connections/:connectionId/qr
Authorization: Bearer <token>
```

#### בדיקת סטטוס חיבור
```http
GET /api/whatsapp/connections/:connectionId
Authorization: Bearer <token>
```

#### עדכון חיבור
```http
PUT /api/whatsapp/connections/:connectionId
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Updated Name",
    "settings": {
        "autoReconnect": false
    }
}
```

### Message Sending

#### שליחת הודעה
```http
POST /api/whatsapp/connections/:connectionId/send
Authorization: Bearer <token>
Content-Type: application/json

{
    "to": "+972501234567",
    "message": "Hello from ChatGrow!",
    "options": {
        "priority": "normal"
    }
}
```

#### שליחת הודעת מדיה
```http
POST /api/whatsapp/connections/:connectionId/send
Authorization: Bearer <token>
Content-Type: application/json

{
    "to": "+972501234567",
    "message": {
        "media": {
            "path": "/path/to/image.jpg",
            "type": "image"
        },
        "caption": "Check out this image!"
    }
}
```

#### שליחת הודעות מרובות (Premium/Enterprise)
```http
POST /api/whatsapp/bulk/send
Authorization: Bearer <token>
Content-Type: application/json

{
    "connectionId": "my_connection_123",
    "messages": [
        { "to": "+972501234567", "content": "Message 1" },
        { "to": "+972501234568", "content": "Message 2" }
    ],
    "options": {
        "priority": "low"
    }
}
```

### Statistics & Monitoring

#### סטטיסטיקות שירות
```http
GET /api/whatsapp/stats
Authorization: Bearer <token>
```

#### בדיקת בריאות
```http
GET /api/whatsapp/health
```

#### חיבורים של משתמש
```http
GET /api/whatsapp/connections
Authorization: Bearer <token>
```

### Webhook Support

#### קבלת הודעות נכנסות
```http
POST /api/whatsapp/webhook/:connectionId
Content-Type: application/json

{
    "message": "Hello from customer",
    "sender": "+972501234567",
    "timestamp": "2024-01-01T12:00:00Z",
    "type": "text"
}
```

## 🔧 הגדרות מתקדמות

### Connection Settings

```javascript
const settings = {
    // Auto-reconnection
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 30000, // 30 seconds
    
    // Message retry
    messageRetryAttempts: 3,
    messageRetryDelay: 5000, // 5 seconds
    
    // Logging
    enableLogging: true,
    enableNotifications: true
};
```

### Rate Limiting

```javascript
// Rate limiting is automatically applied per connection
// Default: 30-45 seconds between messages with ±10s jitter
// Configurable per connection and user plan
```

### Health Monitoring

```javascript
// Health checks run every minute
const health = connection.getHealthStatus();
console.log({
    isHealthy: health.isHealthy,
    heartbeatAge: health.heartbeatAge,
    canSendMessages: health.canSendMessages
});
```

## 📊 ניטור ולוגים

### Log Files

```
logs/
├── error.log          # שגיאות מערכת
├── whatsapp.log       # אירועי WhatsApp
├── api.log           # בקשות API
└── combined.log      # כל הלוגים
```

### Key Metrics

- **Connection Health**: Uptime, last heartbeat, status
- **Message Delivery**: Success rate, delivery time, failures
- **Rate Limiting**: Usage per connection, warnings, blocks
- **Queue Performance**: Processing time, backlog, retries

### Health Check Endpoints

```http
GET /health                    # Overall system health
GET /api/whatsapp/health      # WhatsApp service health
GET /api/logs/health          # Logging system health
```

## 🛡️ אבטחה

### Authentication
- JWT token required for all endpoints
- User-specific connection access
- Plan-based feature restrictions

### Rate Limiting
- Per-connection rate limiting
- User plan message limits
- Automatic jitter to prevent detection

### Input Validation
- Phone number format validation
- Message content validation
- Connection ID validation

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- Retry logic with exponential backoff

## 🔄 Queue Processing

### Message Queue Features

```javascript
// Queue configuration
const queueConfig = {
    concurrency: 5,           // Process 5 messages concurrently
    maxRetries: 3,           // Retry failed messages 3 times
    retryDelays: [5000, 15000, 30000], // Progressive delays
    removeOnComplete: 100,   // Keep last 100 completed jobs
    removeOnFail: 50         // Keep last 50 failed jobs
};
```

### Queue Management

```javascript
// Pause queue processing
await whatsAppWorker.pause();

// Resume queue processing
await whatsAppWorker.resume();

// Get queue statistics
const stats = await whatsAppWorker.getWorkerStats();
```

## 📱 תמיכה במדיה

### Supported Media Types

```javascript
// Image
{
    "media": {
        "path": "/path/to/image.jpg",
        "type": "image"
    },
    "caption": "Optional caption"
}

// Video
{
    "media": {
        "path": "/path/to/video.mp4",
        "type": "video"
    },
    "caption": "Check out this video!"
}

// Audio
{
    "media": {
        "path": "/path/to/audio.mp3",
        "type": "audio"
    }
}

// Document
{
    "media": {
        "path": "/path/to/document.pdf",
        "type": "document"
    },
    "caption": "Important document"
}
```

## 🚨 טיפול בשגיאות

### Common Errors

```javascript
// Connection not found
if (error.message.includes('Connection not found')) {
    // Verify connectionId exists and belongs to user
}

// Connection not ready
if (error.message.includes('Connection not ready')) {
    // Wait for authentication or check connection status
}

// Rate limit exceeded
if (error.message.includes('Rate limit exceeded')) {
    // Implement delays between messages
}

// Invalid phone number
if (error.message.includes('Invalid phone number')) {
    // Use international format: +972501234567
}
```

### Error Recovery

```javascript
// Automatic reconnection
if (connection.status === 'disconnected') {
    await connection.updateStatus('connecting');
    // Service will automatically attempt reconnection
}

// Message retry
if (messageSendFailed) {
    // Queue will automatically retry with exponential backoff
}
```

## 📈 ביצועים ואופטימיזציה

### Performance Tips

1. **Connection Pooling**: Reuse connections when possible
2. **Message Batching**: Use bulk send for multiple recipients
3. **Rate Limiting**: Respect WhatsApp's rate limits
4. **Health Monitoring**: Monitor connection health regularly
5. **Queue Management**: Monitor queue performance and adjust concurrency

### Scaling Considerations

```javascript
// Horizontal scaling
const workerInstances = 3;
const redisCluster = true;

// Load balancing
const connectionDistribution = 'round-robin';
const healthCheckInterval = 30000; // 30 seconds
```

## 🔧 תחזוקה

### Regular Maintenance

```bash
# Clean up old sessions
npm run cleanup-sessions

# Rotate log files
npm run rotate-logs

# Health check
curl http://localhost:3000/api/whatsapp/health
```

### Monitoring Commands

```bash
# Check queue status
curl http://localhost:3000/api/queue/status

# Get service statistics
curl http://localhost:3000/api/whatsapp/stats

# View recent logs
tail -f logs/whatsapp.log
```

## 🧪 בדיקות

### Unit Tests

```bash
npm test whatsapp
```

### Integration Tests

```bash
npm run test:integration:whatsapp
```

### Load Testing

```bash
npm run test:load:whatsapp
```

## 📚 דוגמאות נוספות

### Complete Integration Example

```javascript
const { runWhatsAppDemonstration } = require('./whatsapp-example');

// Run comprehensive demonstration
await runWhatsAppDemonstration();
```

### Custom Implementation

```javascript
class CustomWhatsAppService {
    constructor() {
        this.whatsAppService = require('./services/whatsappService');
    }

    async sendBulkNotification(recipients, message) {
        const connectionId = await this.getDefaultConnection();
        
        for (const recipient of recipients) {
            await this.whatsAppService.sendMessage(
                connectionId,
                recipient,
                message,
                { priority: 'low' }
            );
            
            // Add delay to respect rate limits
            await this.sleep(2000);
        }
    }
}
```

## 🤝 תרומה

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd chatgrow

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Code Style

- Use ES6+ features
- Follow JSDoc documentation
- Implement comprehensive error handling
- Write unit tests for new features

## 📄 רישיון

MIT License - see LICENSE file for details

## 🆘 תמיכה

- 📧 Email: support@chatgrow.com
- 📖 Documentation: https://docs.chatgrow.com
- 🐛 Issues: https://github.com/chatgrow/issues
- 💬 Community: https://community.chatgrow.com

---

**ChatGrow WhatsApp Integration** - מערכת אינטגרציה מתקדמת עם WhatsApp למענה עסקי מקצועי 🚀 