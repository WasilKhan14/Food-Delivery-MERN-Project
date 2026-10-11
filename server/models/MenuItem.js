import mongoose from "mongoose";
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, default: "Popular" },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  vegetarian: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  rating: { type: Number, default: 4.5 }
}, { timestamps: true });
export default mongoose.model("MenuItem", menuItemSchema);
