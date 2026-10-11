import { Router } from "express";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Customer: Place a new order
router.post("/", protect, async (req, res, next) => {
  try {
    const { items, address, phone, location, paymentMethod } = req.body;

    if (!Array.isArray(items) || !items.length || !address?.trim()) {
      return res.status(400).json({
        message: "Cart and delivery address are required.",
      });
    }

    const normalized = [];
    let subtotal = 0;

    for (const line of items) {
      const product = await MenuItem.findById(line.id);
      const quantity = Math.max(
        1,
        Math.min(20, Number(line.quantity) || 1)
      );

      if (!product || !product.available) {
        return res.status(400).json({
          message: "A menu item is unavailable.",
        });
      }

      subtotal += product.price * quantity;

      normalized.push({
        item: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      });
    }

    const method =
      paymentMethod === "DEMO_ONLINE" ? "DEMO_ONLINE" : "COD";

    const order = await Order.create({
      user: req.user._id,
      items: normalized,
      address: address.trim(),
      phone: phone || "",
      location:
        location &&
        Number.isFinite(location.lat) &&
        Number.isFinite(location.lng)
          ? location
          : undefined,
      subtotal,
      deliveryFee: subtotal >= 499 ? 0 : 30,
      total: subtotal + (subtotal >= 499 ? 0 : 30),
      paymentMethod: method,
      paymentStatus:
        method === "DEMO_ONLINE" ? "demo-paid" : "pending",
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// Customer: Get their own orders
router.get("/mine", protect, async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Admin: Get all customer orders
router.get("/admin", protect, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

export default router;