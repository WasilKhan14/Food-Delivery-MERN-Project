import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 8) {
  console.error("Please set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in your .env file.");
  process.exit(1);
}

try {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery"
  );

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.role = "admin";
    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    console.log("Existing account updated as admin.");
  } else {
    await User.create({
      name: "Food Admin",
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin"
    });
    console.log("Admin account created successfully.");
  }
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}