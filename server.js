// --------------------- Imports ---------------------
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// --- Import Route Files ---
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// --- Socket.IO integration ---
const { initSocket } = require("./utils/socket");

// --------------------- Environment Config ---------------------
dotenv.config();

// --------------------- App & Server Setup ---------------------
const app = express();
const server = http.createServer(app);
initSocket(server);

// --------------------- Database Connection ---------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// --------------------- Middleware Setup ---------------------
const allowedOrigins = [
  "http://localhost:3000",
  "https://online-movie-ticket-booking-frontend-pj7x2q9y2.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

// --------------------- API Routes ---------------------
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

// --------------------- Production Deployment ---------------------
// Note: Frontend is deployed separately on Vercel, so no static file serving here
if (process.env.NODE_ENV !== "production") {
  // Serve static files from frontend/public in development
  app.use(express.static(path.join(__dirname, "../frontend/public")));

  app.get("/", (req, res) => {
    res.send("🎬 Movie Booking API is running in development mode...");
  });
}

// --------------------- Error Handling ---------------------
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// --------------------- Server Setup ---------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});

// Handle “port already in use” gracefully
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`⚠️ Port ${PORT} is busy, trying port ${Number(PORT) + 1}...`);
    server.listen(Number(PORT) + 1);
  } else {
    console.error("❌ Server error:", err);
  }
});
