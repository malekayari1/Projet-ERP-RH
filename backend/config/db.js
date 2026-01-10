require("dotenv").config();
const mongoose = require("mongoose");

/**
 * Connexion à MongoDB Atlas ou Locale via .env.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/erp-evaluation";

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected -> ${mongoUri.split("@")[1] || mongoUri}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message || err);
    process.exit(1);
  }
};

module.exports = connectDB;
