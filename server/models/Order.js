import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ item: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }, name: String, price: Number, quantity: Number, image: String }],
  address: { type: String, required: true },
  location: { lat: Number, lng: Number },
  phone: { type: String, default: "" },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 30 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["COD", "DEMO_ONLINE"], default: "COD" },
  paymentStatus: { type: String, enum: ["pending", "demo-paid", "paid", "failed"], default: "pending" },
  status: { type: String, enum: ["Placed", "Confirmed", "Preparing", "Out for delivery", "Delivered", "Cancelled"], default: "Placed" }
}, { timestamps: true });
export default mongoose.model("Order", orderSchema);
