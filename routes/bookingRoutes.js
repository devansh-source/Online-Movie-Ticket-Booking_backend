const express = require('express');
const { createBooking, getUserBookings, lockSeats, confirmBooking, releaseSeats, cancelBooking, getWalletBalance, addToWallet } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Route to create a new booking (requires user authentication)
router.route('/').post(protect, createBooking);

// Route to fetch all bookings for the logged-in user
router.route('/mybookings').get(protect, getUserBookings);

// New routes for real-time seat locking
router.route('/lock-seats').post(protect, lockSeats);
router.route('/confirm-booking').post(protect, confirmBooking);
router.route('/release-seats').delete(protect, releaseSeats);

// Payment and wallet routes
router.route('/cancel').post(protect, cancelBooking);
router.route('/wallet-balance').get(protect, getWalletBalance);
router.route('/add-to-wallet').post(protect, addToWallet);

module.exports = router;
