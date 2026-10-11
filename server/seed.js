import dotenv from "dotenv";
import mongoose from "mongoose";
import MenuItem from "./models/MenuItem.js";
dotenv.config();
const samples = [
  { name: "Classic Cheeseburger", category: "Burgers", price: 179, vegetarian: false, rating: 4.8, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900" , description: "Juicy patty, cheese, lettuce and house sauce."},
  { name: "Margherita Pizza", category: "Pizza", price: 249, vegetarian: true, rating: 4.7, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900", description: "Tomato, mozzarella and fresh basil."},
  { name: "Crispy Fried Chicken", category: "Chicken", price: 229, vegetarian: false, rating: 4.6, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900", description: "Crunchy, golden chicken with a spice blend."},
  { name: "Veggie Bowl", category: "Healthy", price: 159, vegetarian: true, rating: 4.5, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900", description: "Fresh greens, grains and seasonal vegetables."},
  { name: "French Fries", category: "Sides", price: 89, vegetarian: true, rating: 4.4, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900", description: "Crispy fries with a pinch of sea salt."},
  { name: "Chocolate Dessert", category: "Desserts", price: 119, vegetarian: true, rating: 4.7, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900", description: "Rich chocolate treat for sweet cravings."}
];
try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery");
  for (const item of samples) await MenuItem.updateOne({ name: item.name }, { $setOnInsert: item }, { upsert: true });
  console.log("Sample menu ready.");
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
