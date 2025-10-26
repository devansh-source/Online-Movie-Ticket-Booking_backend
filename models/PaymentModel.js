const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        amount: {
            type: Number,
            required: true,
        },
        method: {
            type: String,
            required: true,
            enum: ['stripe', 'wallet', 'razorpay', 'demo'],
        },
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending',
        },
        transactionId: {
            type: String,
        },
    },
    { timestamps: true }
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = Payment;
