import { Router } from "express";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect, adminOnly);

// Dashboard statistics
router.get("/stats", async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalMenuItems,
      totalCustomers,
      sales
    ] = await Promise.all([
      Order.countDocuments(),
      MenuItem.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ])
    ]);

    res.json({
      totalOrders,
      totalMenuItems,
      totalCustomers,
      totalSales: sales[0]?.total || 0
    });
  } catch (e) {
    next(e);
  }
});

// Get all menu items
router.get("/menu", async (req, res, next) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Add food item
router.post("/menu", async (req, res, next) => {
  try {
    const { name, price } = req.body;

    if (
      !name?.trim() ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) {
      return res.status(400).json({
        message: "Valid food name and price are required."
      });
    }

    const item = await MenuItem.create({
      ...req.body,
      name: name.trim(),
      price: Number(price)
    });

    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// Edit food item
router.patch("/menu/:id", async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (
        !Number.isFinite(updates.price) ||
        updates.price <= 0
      ) {
        return res.status(400).json({
          message: "Price must be greater than zero."
        });
      }
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }

    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Delete food item
router.delete("/menu/:id", async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }

    res.json({
      message: "Food item deleted successfully."
    });
  } catch (e) {
    next(e);
  }
});

// Get all customer orders
router.get("/orders", async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (e) {
    next(e);
  }
});

// Update order status
router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const allowed = [
      "Placed",
      "Confirmed",
      "Preparing",
      "Out for delivery",
      "Delivered",
      "Cancelled"
    ];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid order status."
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;