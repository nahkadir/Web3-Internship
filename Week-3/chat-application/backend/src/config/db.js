import mongoose from "mongoose";
// db.js isolates all MongoDB connection logic into one reusable function.

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // mongoose.connect connects to MongoDB & the process.env.MONGO_URI gets the MongoDB connection string from .env
    // await waits until the connection succeeds or fails
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
    // 1 means the program exited because of an error
  }
};

// exports the function so server.js can use it
export default connectDB;
