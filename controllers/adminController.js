const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Movie = require('../models/MovieModel');
const Booking = require('../models/BookingModel');

// @desc    Get dashboard metrics (User/Movie/Booking counts)
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getDashboardMetrics = asyncHandler(async (req, res) => {
    // MongoDB aggregation to count documents
    const userCount = await User.countDocuments({});
    const movieCount = await Movie.countDocuments({});
    const bookingCount = await Booking.countDocuments({});
    const adminCount = await User.countDocuments({ isAdmin: true });

    // Find the latest 5 bookings
    const latestBookings = await Booking.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('movieId', 'title') // Only need the title from the movie
        .populate('userId', 'name email'); // Only need name/email from user

    res.json({
        totalUsers: userCount,
        totalAdmins: adminCount,
        totalMovies: movieCount,
        totalBookings: bookingCount,
        latestBookings: latestBookings,
    });
});

module.exports = { getDashboardMetrics };