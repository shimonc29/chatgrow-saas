# 🔗 ChatGrow Webhooks API

מדריך מלא לשימוש ב-Webhooks API של ChatGrow לאינטגרציה עם מערכות חיצוניות.

## 📚 תוכן עניינים

- [מבוא](#מבוא)
- [התחלה מהירה](#התחלה-מהירה)
- [אימות (Authentication)](#אימות-authentication)
- [Endpoints](#endpoints)
  - [Customers](#customers)
  - [Appointments](#appointments)
  - [Events](#events)
- [דוגמאות קוד](#דוגמאות-קוד)
- [שגיאות נפוצות](#שגיאות-נפוצות)
- [Best Practices](#best-practices)

---

## 🎯 מבוא

ה-Webhooks API של ChatGrow מאפשר למערכות חיצוניות:
- ✅ יצירה ועדכון לקוחות
- ✅ תזמון תורים
- ✅ ניהול אירועים
- ✅ אוטומציה מלאה של תהליכי העבודה

**שימושים נפוצים:**
- סנכרון CRM חיצוני עם ChatGrow
- אינטגרציה עם אתר אינטרנט
- אוטומציה של תהליכי רישום
- חיבור עם מערכות תשלום

---

## 🚀 התחלה מהירה

### 1. קבל API Key

```bash
1. היכנס לחשבון ChatGrow שלך
2. נווט להגדרות → API Keys
3. לחץ על "צור API Key חדש"
4. שמור את ה-Key במקום בטוח (הוא מוצג פעם אחת בלבד!)
```

### 2. בדוק שה-API עובד

```bash
curl -X GET http://localhost:3000/api/webhooks/events \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

אם הכל עובד, תראה:
```json
{
  "success": true,
  "count": 0,
  "events": []
}
```

### 3. צפה בדוקומנטציה האינטראקטיבית

פתח בדפדפן:
```
http://localhost:3000/api-docs
```

תראה ממשק Swagger מלא עם אפשרות לנסות כל endpoint! 🎉

---

## 🔐 אימות (Authentication)

**כל בקשה חייבת לכלול API Key:**

```http
X-API-Key: your-api-key-here
```

### דוגמה ב-cURL:
```bash
curl -H "X-API-Key: abc123..." \
  http://localhost:3000/api/webhooks/customers
```

### דוגמה ב-JavaScript:
```javascript
fetch('http://localhost:3000/api/webhooks/customers', {
  headers: {
    'X-API-Key': 'abc123...',
    'Content-Type': 'application/json'
  }
});
```

### דוגמה ב-Python:
```python
import requests

headers = {
    'X-API-Key': 'abc123...',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:3000/api/webhooks/customers',
    headers=headers
)
```

---

## 📍 Endpoints

### **Customers** - ניהול לקוחות

#### 1. יצירת לקוח חדש

```http
POST /api/webhooks/customers
```

**Request Body:**
```json
{
  "name": "ישראל ישראלי",
  "email": "israel@example.com",
  "phone": "050-1234567",
  "notes": "לקוח חדש מהאתר"
}
```

**Response (201):**
```json
{
  "success": true,
  "customer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "ישראל ישראלי",
    "email": "israel@example.com",
    "phone": "050-1234567",
    "createdAt": "2025-11-23T10:30:00.000Z"
  }
}
```

**דוגמה מלאה (cURL):**
```bash
curl -X POST http://localhost:3000/api/webhooks/customers \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ישראל ישראלי",
    "email": "israel@example.com",
    "phone": "050-1234567",
    "notes": "לקוח VIP"
  }'
```

#### 2. קבלת לקוח לפי אימייל

```http
GET /api/webhooks/customers/:email
```

**דוגמה:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:3000/api/webhooks/customers/israel@example.com
```

**Response (200):**
```json
{
  "success": true,
  "customer": {
    "id": "507f1f77bcf86cd799439011",
    "name": "ישראל ישראלי",
    "email": "israel@example.com",
    "phone": "050-1234567",
    "notes": "לקוח VIP",
    "createdAt": "2025-11-23T10:30:00.000Z",
    "updatedAt": "2025-11-23T10:30:00.000Z"
  }
}
```

---

### **Appointments** - ניהול תורים

#### 1. יצירת תור חדש

```http
POST /api/webhooks/appointments
```

**⚠️ חשוב:** הלקוח חייב להיות קיים במערכת לפני יצירת התור!

**Request Body:**
```json
{
  "customerEmail": "israel@example.com",
  "date": "2025-12-25",
  "time": "14:30",
  "serviceType": "consultation",
  "duration": 60,
  "notes": "תור ראשון"
}
```

**Service Types אפשריים:**
- `consultation` - ייעוץ
- `treatment` - טיפול
- `lesson` - שיעור
- `workshop` - סדנה
- `other` - אחר

**Response (201):**
```json
{
  "success": true,
  "appointment": {
    "id": "507f1f77bcf86cd799439022",
    "customerId": "507f1f77bcf86cd799439011",
    "customerName": "ישראל ישראלי",
    "customerEmail": "israel@example.com",
    "date": "2025-12-25T00:00:00.000Z",
    "time": "14:30",
    "serviceType": "consultation",
    "duration": 60,
    "status": "confirmed",
    "createdAt": "2025-11-23T10:35:00.000Z"
  }
}
```

**דוגמה מלאה (cURL):**
```bash
curl -X POST http://localhost:3000/api/webhooks/appointments \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type": application/json" \
  -d '{
    "customerEmail": "israel@example.com",
    "date": "2025-12-25",
    "time": "14:30",
    "serviceType": "consultation",
    "duration": 60,
    "notes": "תור ראשון"
  }'
```

#### 2. ביטול תור

```http
DELETE /api/webhooks/appointments/:id
```

**דוגמה:**
```bash
curl -X DELETE \
  -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:3000/api/webhooks/appointments/507f1f77bcf86cd799439022
```

**Response (200):**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

---

### **Events** - ניהול אירועים

#### 1. יצירת אירוע חדש

```http
POST /api/webhooks/events
```

**Request Body:**
```json
{
  "title": "סדנת יוגה למתחילים",
  "description": "סדנה מקיפה ליוגה למתחילים",
  "date": "2025-12-30",
  "time": "18:00",
  "location": "אולם הספורט, רחוב הרצל 123",
  "maxParticipants": 20,
  "price": 150
}
```

**Response (201):**
```json
{
  "success": true,
  "event": {
    "id": "507f1f77bcf86cd799439033",
    "title": "סדנת יוגה למתחילים",
    "description": "סדנה מקיפה ליוגה למתחילים",
    "date": "2025-12-30T00:00:00.000Z",
    "time": "18:00",
    "location": "אולם הספורט, רחוב הרצל 123",
    "maxParticipants": 20,
    "price": 150,
    "status": "active",
    "createdAt": "2025-11-23T10:40:00.000Z"
  }
}
```

#### 2. קבלת רשימת אירועים

```http
GET /api/webhooks/events?status=active&limit=50
```

**Query Parameters:**
- `status` (optional): `active`, `completed`, `cancelled`
- `limit` (optional): מספר תוצאות (default: 50)

**דוגמה:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:3000/api/webhooks/events?status=active&limit=10"
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "events": [
    {
      "id": "507f1f77bcf86cd799439033",
      "title": "סדנת יוגה למתחילים",
      "description": "סדנה מקיפה ליוגה למתחילים",
      "date": "2025-12-30T00:00:00.000Z",
      "time": "18:00",
      "location": "אולם הספורט, רחוב הרצל 123",
      "maxParticipants": 20,
      "currentParticipants": 5,
      "price": 150,
      "status": "active"
    }
  ]
}
```

---

## 💻 דוגמאות קוד

### Node.js / JavaScript

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key-here';
const BASE_URL = 'http://localhost:3000/api/webhooks';

// יצירת לקוח
async function createCustomer() {
  try {
    const response = await axios.post(`${BASE_URL}/customers`, {
      name: 'ישראל ישראלי',
      email: 'israel@example.com',
      phone: '050-1234567'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Customer created:', response.data);
    return response.data.customer;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// יצירת תור
async function createAppointment(customerEmail) {
  try {
    const response = await axios.post(`${BASE_URL}/appointments`, {
      customerEmail,
      date: '2025-12-25',
      time: '14:30',
      serviceType: 'consultation',
      duration: 60
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Appointment created:', response.data);
    return response.data.appointment;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// שימוש
(async () => {
  const customer = await createCustomer();
  await createAppointment(customer.email);
})();
```

### Python

```python
import requests

API_KEY = 'your-api-key-here'
BASE_URL = 'http://localhost:3000/api/webhooks'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# יצירת לקוח
def create_customer():
    data = {
        'name': 'ישראל ישראלי',
        'email': 'israel@example.com',
        'phone': '050-1234567'
    }

    response = requests.post(
        f'{BASE_URL}/customers',
        json=data,
        headers=headers
    )

    if response.status_code == 201:
        print('Customer created:', response.json())
        return response.json()['customer']
    else:
        print('Error:', response.json())
        return None

# יצירת תור
def create_appointment(customer_email):
    data = {
        'customerEmail': customer_email,
        'date': '2025-12-25',
        'time': '14:30',
        'serviceType': 'consultation',
        'duration': 60
    }

    response = requests.post(
        f'{BASE_URL}/appointments',
        json=data,
        headers=headers
    )

    if response.status_code == 201:
        print('Appointment created:', response.json())
        return response.json()['appointment']
    else:
        print('Error:', response.json())
        return None

# שימוש
customer = create_customer()
if customer:
    create_appointment(customer['email'])
```

### PHP

```php
<?php

$apiKey = 'your-api-key-here';
$baseUrl = 'http://localhost:3000/api/webhooks';

// יצירת לקוח
function createCustomer($apiKey, $baseUrl) {
    $data = [
        'name' => 'ישראל ישראלי',
        'email' => 'israel@example.com',
        'phone' => '050-1234567'
    ];

    $ch = curl_init("$baseUrl/customers");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-API-Key: $apiKey",
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        $result = json_decode($response, true);
        echo "Customer created: " . print_r($result, true);
        return $result['customer'];
    } else {
        echo "Error: $response";
        return null;
    }
}

// יצירת תור
function createAppointment($customerEmail, $apiKey, $baseUrl) {
    $data = [
        'customerEmail' => $customerEmail,
        'date' => '2025-12-25',
        'time' => '14:30',
        'serviceType' => 'consultation',
        'duration' => 60
    ];

    $ch = curl_init("$baseUrl/appointments");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-API-Key: $apiKey",
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        $result = json_decode($response, true);
        echo "Appointment created: " . print_r($result, true);
        return $result['appointment'];
    } else {
        echo "Error: $response";
        return null;
    }
}

// שימוש
$customer = createCustomer($apiKey, $baseUrl);
if ($customer) {
    createAppointment($customer['email'], $apiKey, $baseUrl);
}
?>
```

---

## ❌ שגיאות נפוצות

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid API Key",
  "error": "Authentication failed"
}
```
**פתרון:** בדוק ש-API Key תקין ושנשלח ב-header `X-API-Key`

### 404 Not Found
```json
{
  "success": false,
  "message": "Customer not found",
  "error": "NOT_FOUND"
}
```
**פתרון:** הלקוח לא קיים במערכת. צור אותו לפני יצירת תור.

### 409 Conflict
```json
{
  "success": false,
  "message": "Time slot is already booked",
  "error": "TIME_CONFLICT"
}
```
**פתרון:** התור כבר תפוס. בחר זמן אחר.

### 400 Validation Error
```json
{
  "success": false,
  "message": "Name and email are required",
  "error": "VALIDATION_ERROR"
}
```
**פתרון:** בדוק ששדות חובה מלאים ותקינים.

---

## 🎯 Best Practices

### 1. **שמור API Keys במקום מאובטח**
```javascript
// ❌ לא טוב - API Key בקוד
const API_KEY = 'abc123...';

// ✅ טוב - משתנה סביבה
const API_KEY = process.env.CHATGROW_API_KEY;
```

### 2. **טפל בשגיאות**
```javascript
try {
  const response = await createCustomer();
} catch (error) {
  if (error.response.status === 409) {
    console.log('Customer already exists');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 3. **השתמש ב-Idempotency**
```javascript
// בדוק אם לקוח קיים לפני יצירה
const existingCustomer = await getCustomer(email);
if (!existingCustomer) {
  await createCustomer({...});
}
```

### 4. **Log requests למעקב**
```javascript
console.log(`[${new Date().toISOString()}] Creating customer: ${email}`);
```

### 5. **Retry Logic לכשלים זמניים**
```javascript
async function createWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createCustomer(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## 📚 משאבים נוספים

- 📖 **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- 🔐 **API Keys Management**: ChatGrow → Settings → API Keys
- 💬 **Support**: support@chatgrow.com
- 📊 **Rate Limits**: ראה [env.example](./env.example) ל-`RATE_LIMIT_*`

---

## 🆘 צריך עזרה?

- 📧 Email: support@chatgrow.com
- 💬 Discord: [ChatGrow Community](#)
- 📖 Docs: [docs.chatgrow.com](#)

---

**נוצר:** 2025-11-23
**גרסה:** 1.0.0
**תחזוקה:** ChatGrow Team
