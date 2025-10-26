const QRCode = require('qrcode');
// Function to generate QR code for a booking
const generateQRCode = async (bookingId, bookingDetails) => {
    try {
        // Create a data string for the QR code (e.g., booking ID and key details)
        const qrData = JSON.stringify({
            bookingId,
            movie: bookingDetails.movieTitle,
            showtime: bookingDetails.showTime,
            seats: bookingDetails.seats,
            totalPrice: bookingDetails.totalPrice,
        });
        // Generate QR code as a data URL (base64 image)
        const qrCodeUrl = await QRCode.toDataURL(qrData);
        return qrCodeUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};
module.exports = { generateQRCode };