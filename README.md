# MERN Food Delivery Demo

A full-stack learning/demo project built with MongoDB, Express, React and Node.js.

## Features
- Responsive food menu with image URLs and category filters
- Search, item details, cart quantity updates and checkout
- Demo checkout: Cash on Delivery or **simulated** online payment
- Delivery address form and optional browser geolocation
- Demo order creation and order status page
- Admin API endpoints for adding/editing/deleting menu items and updating order status
- Image upload endpoint for menu photos (stored locally in `server/uploads`)
- JWT-based signup/login
- MongoDB models for users, menu items and orders

> Important: Online payment is simulated only. Do not enter real card data. To accept real payments, integrate a provider such as Razorpay/Stripe on the server, use test keys first, and follow their security/compliance rules. Geolocation requires browser permission and usually HTTPS (localhost is supported).

## Requirements
- Node.js 18+
- MongoDB Community running locally, or a MongoDB Atlas connection string

## Run it
1. Extract the ZIP.
2. Open the `food_delivery_mern_project` folder in VS Code.
3. Open a terminal and run:
   ```bash
   cd server
   copy .env.example .env
   npm install
   npm run dev
   ```
   On PowerShell, `Copy-Item .env.example .env` also works.
4. In another terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
5. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Edit `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`. The app won't connect until MongoDB is running and the URI is valid.

## Seed sample menu
With the server running:
```bash
cd server
npm run seed
```
This adds sample menu items. Sample photos use remote Unsplash URLs; replace them with your own licensed photos if needed.

## API overview
- `GET /api/health`
- `GET /api/menu`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/orders` (authenticated)
- `GET /api/orders/mine` (authenticated)
- `POST /api/upload` (authenticated; local demo storage)
- `POST /api/admin/menu` (authenticated admin only)
- `PATCH /api/admin/menu/:id`
- `DELETE /api/admin/menu/:id`
- `PATCH /api/admin/orders/:id/status`

For demo admin access, register a user, then manually set `role: "admin"` for that user in MongoDB. Protect admin routes and configure production storage/payment before deployment.

## Suggested resume wording
"Built a responsive MERN food delivery demo with searchable menu, cart, checkout flow, delivery-address/geolocation input, JWT authentication, order tracking, and admin APIs for menu and order management. Online payment is simulated in the demo."
