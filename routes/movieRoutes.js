const express = require('express');
const { getMovies, getMovieById, createMovie, updateMovie, deleteMovie } = require('../controllers/movieController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes for fetching movie data
router.route('/').get(getMovies);
router.route('/:id').get(getMovieById);

// Protected routes (Admin access required for management)
// POST route to create a new movie
router.route('/').post(protect, admin, createMovie);

// PUT and DELETE routes to update and delete a movie by ID
router.route('/:id')
    .put(protect, admin, updateMovie)
    .delete(protect, admin, deleteMovie);

module.exports = router;