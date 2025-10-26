const nodemailer = require('nodemailer');

// 1. Create a transporter object (using environment variables from .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- NEW FUNCTION: Send Welcome Email ---
const sendRegistrationWelcome = async (userEmail, userName) => {
    const mailOptions = {
        from: `Movie Booking System <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `🎉 Welcome to MERN Tickets, ${userName}!`,
        text: `Hello ${userName},\n\nThank you for registering for the MERN Movie Booking System. You can now log in and book your first movie ticket!\n\nHappy Booking!`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #007bff;">Welcome to MERN Tickets!</h2>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Thank you for successfully registering your account with the MERN Movie Booking System.</p>
                <p>You can now log in and explore the latest movies and showtimes!</p>
                <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
                        Go to Login
                    </a>
                </p>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">Happy Booking!</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Welcome email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send welcome email to ${userEmail}:`, error);
        // Do not throw here, as registration should still complete even if the email fails.
    }
};
// ------------------------------------------

// 2. Function to send a booking confirmation email
const sendBookingConfirmation = async (userEmail, bookingDetails) => {
    const mailOptions = {
        from: `Movie Booking System <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '🎟️ Booking Confirmation - MERN Movie Booking',
        text: `Your booking has been confirmed!\n\nMovie: ${bookingDetails.movieTitle}\nShowtime: ${bookingDetails.showtime}\nSeats: ${bookingDetails.seats.join(', ')}\nTotal: $${bookingDetails.totalAmount}\n\nEnjoy your movie!`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #28a745;">Booking Confirmed!</h2>
                <p>Your movie tickets have been successfully booked.</p>
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                    <p><strong>Movie:</strong> ${bookingDetails.movieTitle}</p>
                    <p><strong>Showtime:</strong> ${bookingDetails.showtime}</p>
                    <p><strong>Seats:</strong> ${bookingDetails.seats.join(', ')}</p>
                    <p><strong>Total Amount:</strong> $${bookingDetails.totalAmount}</p>
                </div>
                <p>Please arrive at the theater 15 minutes before showtime.</p>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">Enjoy your movie experience!</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Booking confirmation sent to ${userEmail}`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send booking confirmation to ${userEmail}:`, error);
    }
};

// 3. Function to send a password reset email
const sendPasswordResetEmail = async (userEmail, resetURL) => {
    const mailOptions = {
        from: `Movie Booking System <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '🔑 Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nIf you didn't request this, please ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #dc3545;">Password Reset Request</h2>
                <p>You requested to reset your password for the MERN Movie Booking System.</p>
                <p style="margin: 20px 0;">
                    <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #dc3545; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                </p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p style="font-size: 12px; color: #777;">This link will expire in 10 minutes.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Password reset email sent to ${userEmail}`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send password reset email to ${userEmail}:`, error);
    }
};

module.exports = { 
    sendBookingConfirmation, 
    sendPasswordResetEmail,
    sendRegistrationWelcome // <-- NEW EXPORT
};