import { Router } from "express";
import MenuItem from "../models/MenuItem.js";
const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const filter = { available: true };
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: String(req.query.search), $options: "i" };
    res.json(await MenuItem.find(filter).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});
export default router;
