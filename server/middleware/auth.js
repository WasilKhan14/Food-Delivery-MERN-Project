import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function protect(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Please log in first." });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_only_change_me");
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: "Invalid or expired token." }); }
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required." });
  next();
}
