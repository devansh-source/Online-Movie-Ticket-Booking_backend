const express = require('express');
const { getDashboardMetrics } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Route protected by both user authentication and admin status
router.route('/metrics').get(protect, admin, getDashboardMetrics);

// You can add more admin routes here (e.g., /admin/users, /admin/bookings)

module.exports = router;