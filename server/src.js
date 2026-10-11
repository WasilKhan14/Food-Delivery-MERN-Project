import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));
app.get("/api/health", (_req, res) => res.json({ ok: true, app: "Food Delivery API" }));
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery")
  .then(() => app.listen(port, () => console.log(`Food Delivery API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error("MongoDB connection failed. Start MongoDB and check server/.env", err.message);
    process.exit(1);
  });
