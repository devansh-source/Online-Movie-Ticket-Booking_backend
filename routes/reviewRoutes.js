const express = require('express');
const asyncHandler = require('express-async-handler');
const Review = require('../models/ReviewModel');
const Movie = require('../models/MovieModel');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating || !comment) {
        res.status(400);
        throw new Error('Please provide movieId, rating, and comment');
    }

    const movieExists = await Movie.findById(movieId);
    if (!movieExists) {
        res.status(404);
        throw new Error('Movie not found');
    }

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ userId: req.user._id, movieId });
    if (existingReview) {
        res.status(400);
        throw new Error('You have already reviewed this movie');
    }

    const review = await Review.create({
        userId: req.user._id,
        movieId,
        rating,
        comment,
    });

    // Update movie average rating
    const reviews = await Review.find({ movieId });
    const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Movie.findByIdAndUpdate(movieId, { averageRating: parseFloat(avg.toFixed(1)) });

    res.status(201).json(review);
}));

// @desc    Get reviews for a movie
// @route   GET /api/reviews/:movieId
// @access  Public
router.get('/:movieId', asyncHandler(async (req, res) => {
    const reviews = await Review.find({ movieId: req.params.movieId }).populate('userId', 'name');
    res.json(reviews);
}));

module.exports = router;
