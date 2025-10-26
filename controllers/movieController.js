const asyncHandler = require('express-async-handler');
const Movie = require('../models/MovieModel'); // Ensure this imports the Movie model

// @desc    Fetch all movies
// @route   GET /api/movies
// @access  Public
const getMovies = asyncHandler(async (req, res) => {
    let movies = await Movie.find({});

    // --- TEMPORARY FIX: INSERT DUMMY DATA IF DB IS EMPTY ---
    // This provides movie data with complex showtime/screen details for immediate frontend testing.
    if (movies.length === 0) {
        console.log("Database is empty. Inserting dummy movies for testing...");

        const dummyMovies = [
            {
                title: "Inception",
                description: "A thief who steals corporate secrets through the use of dream-sharing technology. His latest target is a businessman's mind, but the job is complicated by his own past.",
                genre: "Sci-Fi, Thriller",
                duration: 148,
                posterUrl: "https://via.placeholder.com/300x450?text=Inception",
                showtimes: [
                    {
                        time: "14:30",
                        date: new Date(Date.now() + 86400000), // Tomorrow
                        screenDetails: { screenName: "Screen 3 - Standard", rows: 8, cols: 10, totalCapacity: 80 },
                        bookedSeats: ["A1", "A2", "B5"]
                    },
                    {
                        time: "19:00",
                        date: new Date(Date.now() + 86400000), // Tomorrow evening
                        screenDetails: { screenName: "Screen 5 - Premium", rows: 10, cols: 15, totalCapacity: 150 },
                        bookedSeats: ["C1", "C2", "C3", "H15"]
                    },
                ]
            },
            {
                title: "Dune: Part Two",
                description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                genre: "Sci-Fi, Adventure",
                duration: 166,
                posterUrl: "https://via.placeholder.com/300x450?text=Dune+Part+Two",
                showtimes: [
                     {
                        time: "16:00",
                        date: new Date(Date.now() + 172800000), // Day after tomorrow
                        screenDetails: { screenName: "Screen 7 - Standard", rows: 12, cols: 12, totalCapacity: 144 },
                        bookedSeats: ["A1", "B1", "C1", "D1", "E1"]
                    },
                     {
                        time: "21:00",
                        date: new Date(Date.now() + 172800000),
                        screenDetails: { screenName: "Screen 1 - 4DX", rows: 6, cols: 10, totalCapacity: 60 },
                        bookedSeats: ["A5", "A6"]
                    },
                ]
            }
        ];
        
        // Insert dummy data and refetch
        await Movie.insertMany(dummyMovies);
        movies = await Movie.find({});
    }
    // --- END TEMPORARY FIX ---
    
    res.json(movies);
});

// @desc    Fetch single movie
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
        res.json(movie);
    } else {
        res.status(404);
        throw new Error('Movie not found');
    }
});

// @desc    Create a movie (Admin Only)
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = asyncHandler(async (req, res) => {
    const { title, description, posterUrl, genre, duration, releaseDate, showtimes } = req.body;

    if (!title || !description || !posterUrl) {
        res.status(400);
        throw new Error('Please fill all required movie fields');
    }

    const movie = new Movie({
        user: req.user._id, // The Admin user ID
        title,
        description,
        posterUrl,
        genre,
        duration,
        releaseDate,
        showtimes: showtimes || [],
    });

    const createdMovie = await movie.save();
    res.status(201).json(createdMovie);
});

// @desc    Update a movie (Admin Only)
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
    const { title, description, posterUrl, genre, duration, releaseDate, showtimes } = req.body;

    const movie = await Movie.findById(req.params.id);

    if (movie) {
        // Update fields only if they are provided in the request body
        movie.title = title || movie.title;
        movie.description = description || movie.description;
        movie.posterUrl = posterUrl || movie.posterUrl;
        movie.genre = genre || movie.genre;
        movie.duration = duration || movie.duration;
        movie.releaseDate = releaseDate || movie.releaseDate;
        
        // Replace the entire showtimes array if provided
        if (showtimes) {
            movie.showtimes = showtimes;
        }

        const updatedMovie = await movie.save();
        res.json(updatedMovie);
    } else {
        res.status(404);
        throw new Error('Movie not found');
    }
});

// @desc    Delete a movie (Admin Only)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
        await movie.deleteOne(); 
        res.json({ message: 'Movie removed successfully' });
    } else {
        res.status(404);
        throw new new Error('Movie not found');
    }
});


module.exports = {
    getMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie,
};