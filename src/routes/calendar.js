const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const auth = require('../middleware/auth');

const authenticateToken = auth.authenticate();

router.get('/', authenticateToken, calendarController.getCalendarView);

module.exports = router;
