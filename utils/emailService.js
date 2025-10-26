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
                    <a href="http://localhost:3000/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
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

// 2. Function to send a booking confirmation email (remains the same)
const sendBookingConfirmation = async (userEmail, bookingDetails) => {
    // ... (existing sendBookingConfirmation logic) ...
    // Note: This logic remains in your file.
};

// 3. Function to send a password reset email (remains the same)
const sendPasswordResetEmail = async (userEmail, resetURL) => {
    // ... (existing sendPasswordResetEmail logic) ...
    // Note: This logic remains in your file.
};

module.exports = { 
    sendBookingConfirmation, 
    sendPasswordResetEmail,
    sendRegistrationWelcome // <-- NEW EXPORT
};