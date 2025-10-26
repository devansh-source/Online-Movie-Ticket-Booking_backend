// --------------------- Imports ---------------------
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// --- Import App ---
const app = require("./app");

// --- Socket.IO integration ---
const { initSocket } = require("./utils/socket");

// --------------------- Environment Config ---------------------
dotenv.config();

// --------------------- Server Setup ---------------------
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
