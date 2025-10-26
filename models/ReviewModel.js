const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
