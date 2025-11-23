const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChatGrow API',
      version: '1.0.0',
      description: `
# ChatGrow Webhook API

API מלא לאינטגרציה עם מערכות חיצוניות.

## 🔐 Authentication

כל הבקשות דורשות API Key ב-header:
\`\`\`
X-API-Key: your-api-key-here
\`\`\`

## 🚀 Features

- ✅ ניהול לקוחות (Customers)
- ✅ ניהול תורים (Appointments)
- ✅ ניהול אירועים (Events)
- ✅ Webhooks לעדכונים בזמן אמת

## 📝 איך לקבל API Key?

1. היכנס לחשבון ChatGrow שלך
2. נווט להגדרות → API Keys
3. צור API Key חדש
4. העתק את ה-Key (הוא יוצג פעם אחת בלבד!)

## 🔗 Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
\`\`\`

## 📊 Rate Limits

- Free Plan: 100 requests/hour
- Basic Plan: 1,000 requests/hour
- Premium Plan: 10,000 requests/hour
- Enterprise Plan: Unlimited

## 💡 Examples

### Create Customer
\`\`\`bash
curl -X POST https://yourdomain.com/api/webhooks/customers \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "050-1234567"
  }'
\`\`\`

### Create Appointment
\`\`\`bash
curl -X POST https://yourdomain.com/api/webhooks/appointments \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerEmail": "john@example.com",
    "date": "2025-12-25",
    "time": "10:00",
    "serviceType": "consultation"
  }'
\`\`\`
      `,
      contact: {
        name: 'ChatGrow Support',
        email: 'support@chatgrow.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://chatgrow.com/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.chatgrow.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key לאימות. קבל מהגדרות → API Keys'
        }
      },
      schemas: {
        Customer: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              description: 'שם הלקוח',
              example: 'ישראל ישראלי'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'אימייל הלקוח',
              example: 'israel@example.com'
            },
            phone: {
              type: 'string',
              description: 'טלפון הלקוח',
              example: '050-1234567'
            },
            notes: {
              type: 'string',
              description: 'הערות על הלקוח',
              example: 'לקוח VIP'
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['customerEmail', 'date', 'time'],
          properties: {
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'אימייל הלקוח (חייב להיות קיים במערכת)',
              example: 'israel@example.com'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'תאריך התור (YYYY-MM-DD)',
              example: '2025-12-25'
            },
            time: {
              type: 'string',
              description: 'שעת התור (HH:MM)',
              example: '14:30'
            },
            serviceType: {
              type: 'string',
              description: 'סוג השירות',
              example: 'consultation',
              enum: ['consultation', 'treatment', 'lesson', 'workshop', 'other']
            },
            duration: {
              type: 'number',
              description: 'משך התור בדקות',
              example: 60
            },
            notes: {
              type: 'string',
              description: 'הערות לתור',
              example: 'תור ראשון'
            }
          }
        },
        Event: {
          type: 'object',
          required: ['title', 'date'],
          properties: {
            title: {
              type: 'string',
              description: 'כותרת האירוע',
              example: 'סדנת יוגה'
            },
            description: {
              type: 'string',
              description: 'תיאור האירוע',
              example: 'סדנה מקיפה ליוגה למתחילים'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'תאריך האירוע',
              example: '2025-12-25'
            },
            time: {
              type: 'string',
              description: 'שעת האירוע',
              example: '18:00'
            },
            location: {
              type: 'string',
              description: 'מיקום האירוע',
              example: 'אולם הספורט, רחוב הרצל 123'
            },
            maxParticipants: {
              type: 'number',
              description: 'מספר משתתפים מקסימלי',
              example: 20
            },
            price: {
              type: 'number',
              description: 'מחיר כניסה',
              example: 150
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Invalid API Key'
            },
            error: {
              type: 'string',
              example: 'Authentication failed'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'API Key חסר או לא תקין',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'המשאב לא נמצא',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'שגיאת ולידציה - נתונים לא תקינים',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/routes/webhooks.js', './src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
