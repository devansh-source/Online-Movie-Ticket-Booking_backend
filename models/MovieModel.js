const mongoose = require('mongoose');
// --- SUB-SCHEMA: Theater/Screen Details ---
const screenSchema = mongoose.Schema({
    screenName: { type: String, required: true },
    rows: { type: Number, required: true, default: 10 }, 
    cols: { type: Number, required: true, default: 15 }, 
    totalCapacity: { type: Number, required: true },
});
// --- SUB-SCHEMA: Showtime ---
const showtimeSchema = mongoose.Schema({
    time: { type: String, required: true },
    date: { type: Date, required: true },
    screenDetails: screenSchema,
    bookedSeats: [{ type: String }],
    pendingSeats: [{ type: String }], // Temporary locks for real-time booking
});
const movieSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        genre: { type: String },
        duration: { type: Number },
        posterUrl: { type: String, required: true }, 
        showtimes: [showtimeSchema], 
        // --- ADDED THIS FIELD ---
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
    },
    { timestamps: true }
);
// Define Movie model, checking if it already exists
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
module.exports = Movie;