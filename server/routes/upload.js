import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { protect, adminOnly } from "../middleware/auth.js";
const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`)
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
}});
router.post("/", protect, adminOnly, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image file." });
  res.status(201).json({ image: `/uploads/${req.file.filename}` });
});
export default router;
