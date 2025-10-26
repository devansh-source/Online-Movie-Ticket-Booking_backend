const asyncHandler = require('express-async-handler');
const Booking = require('../models/BookingModel');
const Movie = require('../models/MovieModel');
const { sendBookingConfirmation } = require('../utils/emailService'); // Nodemailer utility
const User = require('../models/UserModel');
const Payment = require('../models/PaymentModel');
// --- FIX: Corrected file name import ---
const { generateQRCode } = require('../utils/qrGenerator'); 
const { emitSeatUpdate } = require('../utils/socket');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
// @desc    Create new booking and update seat availability
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
    const { movieId, showtimeId, seatsBooked, totalPrice } = req.body;
    const userId = req.user._id;
    if (!movieId || !showtimeId || !seatsBooked || seatsBooked.length === 0 || !totalPrice) {
        res.status(400);
        throw new Error('Missing required booking details.');
    }
    // 1. Find the movie and the specific showtime
    const movie = await Movie.findById(movieId);
    if (!movie) {
        res.status(404);
        throw new Error('Movie not found');
    }
    // Find the specific showtime using its ID (Mongoose generates _id for nested docs)
    const showtime = movie.showtimes.id(showtimeId); 
    
    if (!showtime) {
        res.status(404);
        throw new Error('Showtime not found');
    }
    // 2. Validate Seat Availability (CRITICAL STEP)
    const existingBookedSeats = showtime.bookedSeats || [];
    const seatsToBook = new Set(seatsBooked);
    
    for (const seat of seatsToBook) {
        if (existingBookedSeats.includes(seat)) {
            res.status(400);
            throw new Error(`Seat ${seat} is already booked.`);
        }
    }
    
    // --- FIX: Changed 'showtime.capacity' to 'showtime.screenDetails.totalCapacity' ---
    if (existingBookedSeats.length + seatsToBook.size > showtime.screenDetails.totalCapacity) {
        res.status(400);
        throw new Error('Requested seats exceed screen capacity.');
    }
    // 3. Update the Movie document (mark seats as booked)
    // Add the new seats to the showtime's bookedSeats array
    showtime.bookedSeats.push(...seatsBooked);
    await movie.save();
    // 4. Create the Booking Record
    const booking = await Booking.create({
        userId,
        movieId,
        showtimeId,
        seatsBooked: Array.from(seatsToBook), // Use the validated array
        totalPrice,
        status: 'Confirmed'
    });
    // 5. Send Confirmation Email
    const user = await User.findById(userId);
    const bookingDetails = {
        userName: user.name,
        userEmail: user.email,
        movieTitle: movie.title,
        showTime: `${showtime.time} on ${new Date(showtime.date).toLocaleDateString()}`,
        seats: Array.from(seatsToBook),
        totalPrice: totalPrice.toFixed(2), // This is correct
        bookingId: booking._id,
    };
    
    // Call the Nodemailer utility function
    await sendBookingConfirmation(user.email, bookingDetails);
    res.status(201).json({
        message: 'Booking successful! Confirmation email sent.',
        bookingId: booking._id,
        booking,
    });
});
// @desc    Get user's bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
    // Find all bookings for the currently logged-in user
    const bookings = await Booking.find({ userId: req.user._id })
        .populate('movieId', 'title posterUrl') // Join with Movie collection to get title/poster
        .sort({ createdAt: -1 });
    res.json(bookings);
});
// @desc    Lock seats temporarily for real-time booking
// @route   POST /api/bookings/lock-seats
// @access  Private
const lockSeats = asyncHandler(async (req, res) => {
    const { movieId, showtimeId, seatsToLock } = req.body;
    const userId = req.user._id;
    if (!movieId || !showtimeId || !seatsToLock || seatsToLock.length === 0) {
        res.status(400);
        throw new Error('Missing required details for seat locking.');
    }
    const movie = await Movie.findById(movieId);
    if (!movie) {
        res.status(404);
        throw new Error('Movie not found');
    }
    const showtime = movie.showtimes.id(showtimeId);
    if (!showtime) {
        res.status(404);
        throw new Error('Showtime not found');
    }
    const existingBookedSeats = showtime.bookedSeats || [];
    const existingPendingSeats = showtime.pendingSeats || [];
    // Check if seats are already booked or pending
    for (const seat of seatsToLock) {
        if (existingBookedSeats.includes(seat) || existingPendingSeats.includes(seat)) {
            res.status(400);
            throw new Error(`Seat ${seat} is already locked or booked.`);
        }
    }
    // Lock seats for 10 minutes
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    showtime.pendingSeats.push(...seatsToLock);
    await movie.save();
    // Create pending booking
    const pendingBooking = await Booking.create({
        userId,
        movieId,
        showtimeId,
        seatsBooked: seatsToLock,
        totalPrice: 0, // To be calculated later
        status: 'Pending',
        bookingExpiry: expiry,
    });
    // Emit real-time update
    emitSeatUpdate(showtimeId, { pendingSeats: showtime.pendingSeats, bookedSeats: showtime.bookedSeats });
    res.status(200).json({
        message: 'Seats locked successfully.',
        pendingBookingId: pendingBooking._id,
        expiry,
    });
});
// @desc    Confirm booking and generate QR code
// @route   POST /api/bookings/confirm-booking
// @access  Private
const confirmBooking = asyncHandler(async (req, res) => {
    const { pendingBookingId, totalPrice, paymentMethod, stripeToken } = req.body;
    const userId = req.user._id;
    console.log('Confirm booking request:', { pendingBookingId, totalPrice, paymentMethod, userId });
    if (!pendingBookingId || !totalPrice || !paymentMethod) {
        res.status(400);
        throw new Error('Missing required fields: pendingBookingId, totalPrice, or paymentMethod.');
    }
    const booking = await Booking.findById(pendingBookingId);
    if (!booking) {
        res.status(400);
        throw new Error('Pending booking not found.');
    }
    if (booking.userId.toString() !== userId.toString()) {
        res.status(400);
        throw new Error('Booking does not belong to the current user.');
    }
    if (booking.status !== 'Pending') {
        res.status(400);
        throw new Error('Booking is not in pending status.');
    }
    if (booking.bookingExpiry < new Date()) {
        // Expired, release seats
        await releaseSeats(booking.movieId, booking.showtimeId, booking.seatsBooked);
        await Booking.findByIdAndDelete(pendingBookingId);
        res.status(400);
        throw new Error('Booking expired. Seats released.');
    }
    // Process payment (online only)
    let paymentRecord;
    if (stripeToken && stripe) {
        // Stripe payment
        const charge = await stripe.charges.create({
            amount: totalPrice * 100, // Stripe expects amount in cents
            currency: 'usd',
            source: stripeToken,
            description: `Booking for ${booking._id}`,
        });
        paymentRecord = await Payment.create({
            userId,
            bookingId: booking._id,
            amount: totalPrice,
            method: 'stripe',
            status: 'Completed',
            transactionId: charge.id,
        });
    } else {
        // Demo online payment without Stripe
        paymentRecord = await Payment.create({
            userId,
            bookingId: booking._id,
            amount: totalPrice,
            method: 'demo',
            status: 'Completed',
        });
    }
    // Move pending to booked
    const movie = await Movie.findById(booking.movieId);
    const showtime = movie.showtimes.id(booking.showtimeId);
    showtime.pendingSeats = showtime.pendingSeats.filter(seat => !booking.seatsBooked.includes(seat));
    showtime.bookedSeats.push(...booking.seatsBooked);
    await movie.save();
    // Update booking
    booking.status = 'Confirmed';
    booking.totalPrice = parseFloat(totalPrice);
    booking.bookingExpiry = undefined;
    booking.paymentId = paymentRecord._id;
    // Generate QR code
    const user = await User.findById(userId);
    const bookingDetails = {
        movieTitle: movie.title,
        showTime: `${showtime.time} on ${new Date(showtime.date).toLocaleDateString()}`,
        seats: booking.seatsBooked,
        totalPrice: totalPrice.toFixed(2),
    };
    const qrCodeUrl = await generateQRCode(booking._id, bookingDetails);
    booking.qrCodeUrl = qrCodeUrl;
    await booking.save();
    // Send email
    await sendBookingConfirmation(user.email, { ...bookingDetails, userName: user.name, userEmail: user.email, bookingId: booking._id });
    // Emit update
    emitSeatUpdate(booking.showtimeId, { pendingSeats: showtime.pendingSeats, bookedSeats: showtime.bookedSeats });
    res.status(200).json({
        message: 'Booking confirmed! QR code generated.',
        booking,
        qrCodeUrl,
    });
});
// @desc    Release locked seats (on expiry or cancel)
// @route   DELETE /api/bookings/release-seats
// @access  Private
const releaseSeats = asyncHandler(async (req, res) => {
    const { movieId, showtimeId, seatsToRelease } = req.body;
    const userId = req.user._id;
    const movie = await Movie.findById(movieId);
    if (!movie) {
        res.status(404);
        throw new Error('Movie not found');
    }
    const showtime = movie.showtimes.id(showtimeId);
    if (!showtime) {
        res.status(404);
        throw new Error('Showtime not found');
    }
    // Remove from pending
    showtime.pendingSeats = showtime.pendingSeats.filter(seat => !seatsToRelease.includes(seat));
    await movie.save();
    // Delete pending booking if exists
    await Booking.deleteMany({ userId, movieId, showtimeId, status: 'Pending', seatsBooked: { $in: seatsToRelease } });
    // Emit update
    emitSeatUpdate(showtimeId, { pendingSeats: showtime.pendingSeats, bookedSeats: showtime.bookedSeats });
    res.status(200).json({ message: 'Seats released.' });
});
// Helper function to release seats (used internally)
const releaseSeatsHelper = async (movieId, showtimeId, seats) => {
    const movie = await Movie.findById(movieId);
    const showtime = movie.showtimes.id(showtimeId);
    showtime.pendingSeats = showtime.pendingSeats.filter(seat => !seats.includes(seat));
    await movie.save();
    emitSeatUpdate(showtimeId, { pendingSeats: showtime.pendingSeats, bookedSeats: showtime.bookedSeats });
};
// @desc    Cancel booking and process refund
// @route   POST /api/bookings/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const userId = req.user._id;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== userId.toString()) {
        res.status(404);
        throw new Error('Booking not found.');
    }
    if (booking.status !== 'Confirmed') {
        res.status(400);
        throw new Error('Only confirmed bookings can be canceled.');
    }
    // Check if cancellation is within allowed time (e.g., 24 hours before showtime)
    const movie = await Movie.findById(booking.movieId);
    const showtime = movie.showtimes.id(booking.showtimeId);
    const showtimeDateTime = new Date(`${showtime.date}T${showtime.time}`);
    const now = new Date();
    const hoursBefore = (showtimeDateTime - now) / (1000 * 60 * 60);
    if (hoursBefore < 24) {
        res.status(400);
        throw new Error('Cancellation not allowed within 24 hours of showtime.');
    }
    // Process refund
    const payment = await Payment.findById(booking.paymentId);
    if (payment && payment.status === 'Completed') {
        if (payment.method === 'stripe') {
            const refund = await stripe.refunds.create({
                charge: payment.transactionId,
            });
            payment.status = 'Refunded';
            payment.transactionId = refund.id;
            await payment.save();
        } else if (payment.method === 'wallet') {
            const user = await User.findById(userId);
            user.walletBalance += booking.totalPrice;
            await user.save();
            payment.status = 'Refunded';
            await payment.save();
        }
    }
    // Update booking
    booking.status = 'Canceled';
    booking.refundStatus = 'Processed';
    await booking.save();
    // Release seats
    showtime.bookedSeats = showtime.bookedSeats.filter(seat => !booking.seatsBooked.includes(seat));
    await movie.save();
    // Emit update
    emitSeatUpdate(booking.showtimeId, { pendingSeats: showtime.pendingSeats, bookedSeats: showtime.bookedSeats });
    res.status(200).json({ message: 'Booking canceled and refunded.' });
});
// @desc    Get user's wallet balance
// @route   GET /api/bookings/wallet-balance
// @access  Private
const getWalletBalance = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ walletBalance: user.walletBalance, loyaltyPoints: user.loyaltyPoints, membershipTier: user.membershipTier });
});
// @desc    Add money to wallet
// @route   POST /api/bookings/add-to-wallet
// @access  Private
const addToWallet = asyncHandler(async (req, res) => {
    const { amount, stripeToken } = req.body;
    const userId = req.user._id;
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount.');
    }
    // Update user wallet
    const user = await User.findById(userId);
    user.walletBalance += amount;
    user.loyaltyPoints += Math.floor(amount / 10); // 1 point per $10
    await user.save();
    // Create payment record
    if (stripeToken && stripe) {
        // Process payment via Stripe if token provided and configured
        const charge = await stripe.charges.create({
            amount: amount * 100,
            currency: 'usd',
            source: stripeToken,
            description: `Wallet top-up for user ${userId}`,
        });
        await Payment.create({
            userId,
            amount,
            method: 'stripe',
            status: 'Completed',
            transactionId: charge.id,
        });
    } else {
        // Demo mode: allow top-up without payment (even if token provided but stripe not configured)
        await Payment.create({
            userId,
            amount,
            method: 'demo',
            status: 'Completed',
        });
    }
    res.status(200).json({ message: 'Wallet topped up successfully.', newBalance: user.walletBalance });
});
module.exports = { createBooking, getUserBookings, lockSeats, confirmBooking, releaseSeats, cancelBooking, getWalletBalance, addToWallet };