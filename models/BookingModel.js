const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Movie',
        },
        showtimeId: {
            type: String,
            required: true,
        },
        seatsBooked: {
            type: [String],
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'Confirmed',
            enum: ['Confirmed', 'Pending', 'Canceled']
        },
        bookingExpiry: {
            type: Date, // For pending bookings, expiry time for seat lock
        },
        qrCodeUrl: {
            type: String, // URL or data for QR code e-ticket
        },
        paymentId: {
            type: String,
        },
        refundStatus: {
            type: String,
            enum: ['None', 'Pending', 'Processed', 'Rejected'],
            default: 'None'
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;