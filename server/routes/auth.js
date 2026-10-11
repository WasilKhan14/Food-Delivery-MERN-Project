import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const router = Router();
const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_only_change_me", { expiresIn: "7d" });
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Name, email and password (6+ chars) required." });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered." });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});
export default router;
