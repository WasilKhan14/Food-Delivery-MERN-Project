
import React, { useEffect, useMemo, useState } from "react";
import {
  Search, ShoppingBag, MapPin, Clock, Star, Plus, Minus, X,
  LocateFixed, Utensils, Bike, CheckCircle2, UserRound, LogOut,
  ImagePlus, PackageCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FALLBACK = [
  { _id: "demo1", name: "Classic Cheeseburger", category: "Burgers", price: 179, rating: 4.8, vegetarian: false, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900", description: "Juicy patty, cheese, lettuce and house sauce." },
  { _id: "demo2", name: "Margherita Pizza", category: "Pizza", price: 249, rating: 4.7, vegetarian: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900", description: "Tomato, mozzarella and fresh basil." },
  { _id: "demo3", name: "Crispy Fried Chicken", category: "Chicken", price: 229, rating: 4.6, vegetarian: false, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900", description: "Crunchy golden chicken with a spicy coating." },
  { _id: "demo4", name: "Fresh Veggie Bowl", category: "Healthy", price: 159, rating: 4.5, vegetarian: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900", description: "Fresh greens, grains and seasonal vegetables." },
  { _id: "demo5", name: "Crispy French Fries", category: "Sides", price: 89, rating: 4.4, vegetarian: true, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900", description: "Golden fries with a pinch of sea salt." },
  { _id: "demo6", name: "Chocolate Dessert", category: "Desserts", price: 119, rating: 4.7, vegetarian: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900", description: "A rich chocolate treat for sweet cravings." }
];

const categories = ["All", "Burgers", "Pizza", "Chicken", "Healthy", "Sides", "Desserts"];

const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Out for delivery",
  "Delivered",
  "Cancelled"
];

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function App() {
  const [menu, setMenu] = useState(FALLBACK);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fooddelivery_user") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("fooddelivery_token") || ""
  );

  const [orders, setOrders] = useState([]);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [form, setForm] = useState({
    address: "",
    phone: "",
    paymentMethod: "COD",
    lat: null,
    lng: null
  });

  const [busy, setBusy] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminOrdersOpen, setAdminOrdersOpen] = useState(false);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const [adminForm, setAdminForm] = useState({
    name: "",
    category: "Burgers",
    price: "",
    description: "",
    image: "",
    vegetarian: false
  });

  // Load menu from backend.
  useEffect(() => {
    fetch(`${API}/menu`)
      .then(response => {
        if (!response.ok) throw new Error("Could not load menu");
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMenu(data);
        }
      })
      .catch(error => {
        console.error("Menu loading error:", error);
      });
  }, []);

  const filtered = useMemo(
    () =>
      menu.filter(item => {
        const categoryMatch =
          category === "All" || item.category === category;

        const searchMatch =
          `${item.name} ${item.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase());

        return categoryMatch && searchMatch;
      }),
    [menu, category, search]
  );

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 30;
  const total = subtotal + delivery;

  const notify = message => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const add = item => {
    setCart(old => {
      const found = old.find(x => x._id === item._id);

      return found
        ? old.map(x =>
            x._id === item._id
              ? { ...x, quantity: x.quantity + 1 }
              : x
          )
        : [...old, { ...item, quantity: 1 }];
    });

    notify(`${item.name} added to cart`);
  };

  const changeQty = (id, delta) => {
    setCart(old =>
      old
        .map(item =>
          item._id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setForm(old => ({
          ...old,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));

        notify("Location attached successfully.");
      },
      () => {
        notify("Location permission denied. Enter your address manually.");
      }
    );
  };

  // Login and registration.
  const submitAuth = async event => {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch(
        `${API}/auth/${authMode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authForm)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not authenticate.");
      }

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("fooddelivery_token", data.token);
      localStorage.setItem("fooddelivery_user", JSON.stringify(data.user));

      setAuthOpen(false);
      setAuthForm({ name: "", email: "", password: "" });

      notify("Login successful!");
    } catch (error) {
      notify(error.message || "Could not authenticate.");
    } finally {
      setBusy(false);
    }
  };

  // Load logged-in customer's order history.
  const loadOrders = async () => {
    if (!token) {
      setAuthOpen(true);
      notify("Please sign in to view your orders.");
      return;
    }

    try {
      const response = await fetch(`${API}/orders/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load your orders.");
      }

      setOrders(Array.isArray(data) ? data : []);
      setOrdersOpen(true);
    } catch (error) {
      notify(error.message || "Could not load orders.");
    }
  };

  // Admin: load orders from all customers.
  const loadAdminOrders = async () => {
    if (!token || user?.role !== "admin") {
      notify("Please sign in with your admin account.");
      return;
    }

    setAdminOrdersLoading(true);

    try {
      const response = await fetch(`${API}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load admin orders.");
      }

      setAdminOrders(Array.isArray(data) ? data : []);
      setAdminOrdersOpen(true);
    } catch (error) {
      notify(error.message || "Could not load admin orders.");
    } finally {
      setAdminOrdersLoading(false);
    }
  };

  // Admin: update order status.
  const updateOrderStatus = async (orderId, status) => {
    if (!token || user?.role !== "admin") {
      notify("Admin login required.");
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      const response = await fetch(
        `${API}/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update failed.");
      }

      const updatedOrder = data.order || data;

      setAdminOrders(old =>
        old.map(order =>
          order._id === orderId
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      notify("Order status updated successfully!");
    } catch (error) {
      notify(error.message || "Could not update order status.");
      await loadAdminOrders();
    } finally {
      setUpdatingOrderId("");
    }
  };

  // Place a customer order.
  const placeOrder = async event => {
    event.preventDefault();

    if (!cart.length) {
      notify("Your cart is empty.");
      return;
    }

    if (!token) {
      setCheckoutOpen(false);
      setAuthOpen(true);
      notify("Please log in or register before ordering.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item._id,
            quantity: item.quantity
          })),
          address: form.address,
          phone: form.phone,
          paymentMethod: form.paymentMethod,
          location:
            form.lat != null
              ? { lat: form.lat, lng: form.lng }
              : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order failed.");
      }

      setLastOrder(data);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);

      setOrders(old => [data, ...old]);
      setOrdersOpen(true);

      notify("Order placed successfully!");
    } catch (error) {
      notify(
        error.message === "Failed to fetch"
          ? "Start the backend server before placing an order."
          : error.message || "Order failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken("");
    setOrders([]);
    setAdminOrders([]);
    setLastOrder(null);

    setAdminOrdersOpen(false);
    setOrdersOpen(false);

    localStorage.removeItem("fooddelivery_user");
    localStorage.removeItem("fooddelivery_token");

    notify("Signed out successfully.");
  };

  // Admin: upload food image.
  const uploadImage = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token || user?.role !== "admin") {
      notify("Sign in with an admin account to upload images.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      if (!data.image) {
        throw new Error("Image URL was not returned by the server.");
      }

      const imageUrl = data.image.startsWith("http")
        ? data.image
        : `http://localhost:5000${data.image}`;

      setAdminForm(old => ({ ...old, image: imageUrl }));
      notify("Image uploaded successfully.");
    } catch (error) {
      notify(error.message || "Image upload failed.");
    }
  };

  // Admin: add a menu item.
  const addMenuItem = async event => {
    event.preventDefault();

    if (!token || user?.role !== "admin") {
      notify("Admin login required to add menu items.");
      return;
    }

    try {
      const response = await fetch(`${API}/admin/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...adminForm,
          price: Number(adminForm.price)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add menu item.");
      }

      const newItem = data.item || data;

      setMenu(old => [newItem, ...old]);

      setAdminForm({
        name: "",
        category: "Burgers",
        price: "",
        description: "",
        image: "",
        vegetarian: false
      });

      setAdminOpen(false);
      notify("Menu item added successfully.");
    } catch (error) {
      notify(error.message || "Could not add menu item.");
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#menu">
          <span className="brand-icon">
            <Utensils size={22} />
          </span>
          <span>
            Food <span className="brand-orange">Delivery</span>
            <small>GOOD FOOD. GOOD MOOD.</small>
          </span>
        </a>

        <div className="location">
          <MapPin size={18} />
          <div>
            <small>DELIVERING TO</small>
            <strong>
              {form.address
                ? form.address.slice(0, 25)
                : form.lat != null
                  ? "Location attached"
                  : "Your location"}
            </strong>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={requestLocation}
            title="Use my location"
          >
            <LocateFixed size={17} />
          </button>
        </div>

        <div className="header-actions">
          <button className="nav-btn" onClick={loadOrders}>
            <PackageCheck size={17} /> Orders
          </button>

          {user ? (
            <button className="nav-btn" onClick={signOut}>
              <LogOut size={17} />
              {user.name?.split(" ")[0] || "Account"}
            </button>
          ) : (
            <button className="nav-btn" onClick={() => setAuthOpen(true)}>
              <UserRound size={17} /> Sign in
            </button>
          )}

          {user?.role === "admin" && (
            <button
              className="nav-btn"
              onClick={loadAdminOrders}
              disabled={adminOrdersLoading}
            >
              <PackageCheck size={17} />
              {adminOrdersLoading ? "Loading..." : "Admin Orders"}
            </button>
          )}

          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={19} /> Cart <b>{count}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot" /> FRESH • FAST • DELICIOUS
            </span>

            <h1>
              Cravings? We’ve
              <br />
              got <em>you covered.</em>
            </h1>

            <p>Restaurant favourites, delivered fresh to your door.</p>

            <button
              className="primary-btn"
              onClick={() =>
                document.getElementById("menu")?.scrollIntoView({
                  behavior: "smooth"
                })
              }
            >
              Explore menu <span>↘</span>
            </button>

            <div className="hero-stats">
              <span><Clock size={17} /> 25–40 min</span>
              <span><Star size={17} fill="currentColor" /> 4.8 rated</span>
              <span><Bike size={18} /> Free over ₹499</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-circle" />
            <img src={FALLBACK[0].image} alt="Delicious burger" />

            <div className="floating-card">
              <span>🔥</span>
              <div>
                <b>Top pick today</b>
                <small>Classic Cheeseburger</small>
              </div>
              <strong>₹179</strong>
            </div>

            <div className="floating-badge">
              MADE WITH
              <br />
              LOVE <span>♥</span>
            </div>
          </div>
        </section>

        <section className="benefits">
          <div>
            <span className="benefit-icon peach">♨</span>
            <div><b>Freshly prepared</b><small>Made when you order</small></div>
          </div>
          <div>
            <span className="benefit-icon yellow">⌁</span>
            <div><b>Fast delivery</b><small>Hot food, happy mood</small></div>
          </div>
          <div>
            <span className="benefit-icon green">✓</span>
            <div><b>Quality ingredients</b><small>Goodness in every bite</small></div>
          </div>
          <div>
            <span className="benefit-icon purple">♡</span>
            <div><b>Made for you</b><small>Find your new favourite</small></div>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE GOOD STUFF</span>
              <h2>Explore our <em>menu</em></h2>
              <p>Big flavours. Little moments of happiness.</p>
            </div>

            <label className="searchbox">
              <Search size={19} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search your cravings..."
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          <div className="categories">
            {categories.map(itemCategory => (
              <button
                key={itemCategory}
                className={
                  category === itemCategory
                    ? "category active"
                    : "category"
                }
                onClick={() => setCategory(itemCategory)}
              >
                {itemCategory}
              </button>
            ))}
          </div>

          <div className="food-grid">
            {filtered.map((item, index) => (
              <article className="food-card" key={item._id}>
                <div className="food-image">
                  <img
                    src={item.image || FALLBACK[index % FALLBACK.length].image}
                    alt={item.name}
                    onError={event => {
                      event.currentTarget.src = FALLBACK[0].image;
                    }}
                  />

                  <span className="food-tag">
                    {item.vegetarian ? "🌱 Veg" : "Chef's pick"}
                  </span>

                  <button
                    className="add-btn"
                    onClick={() => add(item)}
                    aria-label={`Add ${item.name}`}
                  >
                    <Plus size={21} />
                  </button>
                </div>

                <div className="food-info">
                  <div className="food-title">
                    <h3>{item.name}</h3>
                    <span className="rating">
                      <Star size={13} fill="currentColor" />
                      {item.rating || 4.5}
                    </span>
                  </div>

                  <p>{item.description}</p>

                  <div className="food-bottom">
                    <strong>{money(item.price)}</strong>
                    <span>{item.category}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty">
              <Search size={30} />
              <h3>No bites found</h3>
              <p>Try another search or category.</p>
            </div>
          )}
        </section>

        <section className="promo">
          <div>
            <span className="eyebrow">A LITTLE SOMETHING EXTRA</span>
            <h2>
              Good things come
              <br />
              to those who <em>order.</em>
            </h2>
            <p>Delivery is on us when your order reaches ₹499.</p>
            <button
              className="primary-btn"
              onClick={() =>
                document.getElementById("menu")?.scrollIntoView({
                  behavior: "smooth"
                })
              }
            >
              Find your favourites ↗
            </button>
          </div>

          <div className="promo-emoji">
            🍕<span>🍟</span><i>🥤</i>
          </div>
        </section>

        <section className="bottom-note">
          <div>
            <span className="brand-icon"><Utensils size={20} /></span>
            <h3>Food Delivery</h3>
          </div>
          <p>A student-built food delivery demo. Fresh ideas, one order at a time.</p>
          <small>Demo project • Payments are simulated • © 2026 Food Delivery</small>
        </section>
      </main>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* CART */}
      {cartOpen && (
        <div
          className="overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside className="drawer">
            <div className="drawer-head">
              <div>
                <span className="eyebrow">YOUR SELECTION</span>
                <h2>Your cart <span>({count})</span></h2>
              </div>
              <button className="close-btn" onClick={() => setCartOpen(false)}>
                <X />
              </button>
            </div>

            {!cart.length ? (
              <div className="empty cart-empty">
                <span>🛍️</span>
                <h3>Your cart is hungry</h3>
                <p>Add something delicious to get started.</p>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setCartOpen(false);
                    document.getElementById("menu")?.scrollIntoView({
                      behavior: "smooth"
                    });
                  }}
                >
                  Browse menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map(item => (
                    <div className="cart-line" key={item._id}>
                      <img src={item.image} alt={item.name} />

                      <div className="cart-line-info">
                        <b>{item.name}</b>
                        <strong>{money(item.price)}</strong>

                        <div className="qty">
                          <button onClick={() => changeQty(item._id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => changeQty(item._id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          setCart(old => old.filter(x => x._id !== item._id))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bill">
                  <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
                  <div>
                    <span>Delivery fee</span>
                    <b>{delivery === 0 ? "FREE" : money(delivery)}</b>
                  </div>

                  {subtotal > 0 && subtotal < 499 && (
                    <small>
                      Add {money(499 - subtotal)} more for free delivery
                    </small>
                  )}

                  <div className="bill-total">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <button
                    className="primary-btn full"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                  >
                    Continue to checkout ↗
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <div className="overlay">
          <section className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">ALMOST THERE</span>
                <h2>Checkout</h2>
              </div>
              <button className="close-btn" onClick={() => setCheckoutOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={placeOrder} className="checkout-form">
              <label>
                Delivery address
                <textarea
                  required
                  minLength={8}
                  value={form.address}
                  onChange={event =>
                    setForm(old => ({ ...old, address: event.target.value }))
                  }
                  placeholder="Flat / house, street, area, city"
                />
              </label>

              <button
                type="button"
                className="location-btn"
                onClick={requestLocation}
              >
                <LocateFixed size={17} />
                {form.lat != null
                  ? "Location attached"
                  : "Use my current location"}
              </button>

              <label>
                Phone number
                <input
                  required
                  value={form.phone}
                  onChange={event =>
                    setForm(old => ({ ...old, phone: event.target.value }))
                  }
                  placeholder="Your contact number"
                  inputMode="tel"
                  minLength={8}
                />
              </label>

              <label>
                Payment method
                <select
                  value={form.paymentMethod}
                  onChange={event =>
                    setForm(old => ({
                      ...old,
                      paymentMethod: event.target.value
                    }))
                  }
                >
                  <option value="COD">Cash on Delivery</option>
                  <option value="DEMO_ONLINE">
                    Online payment (demo simulation)
                  </option>
                </select>
              </label>

              {form.paymentMethod === "DEMO_ONLINE" && (
                <div className="demo-warning">
                  Demo only: no real money is charged. Do not enter card details.
                </div>
              )}

              <div className="checkout-total">
                <span>Total payable</span>
                <strong>{money(total)}</strong>
              </div>

              <button className="primary-btn full" disabled={busy}>
                {busy ? "Placing order..." : `Place order • ${money(total)}`}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* LOGIN / REGISTER */}
      {authOpen && (
        <div className="overlay">
          <section className="modal auth-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">WELCOME TO FOOD DELIVERY</span>
                <h2>
                  {authMode === "login" ? "Good to see you" : "Create account"}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setAuthOpen(false)}>
                <X />
              </button>
            </div>

            <form className="checkout-form" onSubmit={submitAuth}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    required
                    value={authForm.name}
                    onChange={event =>
                      setAuthForm(old => ({ ...old, name: event.target.value }))
                    }
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={event =>
                    setAuthForm(old => ({ ...old, email: event.target.value }))
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  minLength={6}
                  required
                  value={authForm.password}
                  onChange={event =>
                    setAuthForm(old => ({
                      ...old,
                      password: event.target.value
                    }))
                  }
                  placeholder="At least 6 characters"
                />
              </label>

              <button className="primary-btn full" disabled={busy}>
                {busy
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="switch-auth">
              {authMode === "login"
                ? "New here?"
                : "Already have an account?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(old => old === "login" ? "register" : "login")
                }
              >
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </section>
        </div>
      )}

      {/* CUSTOMER ORDERS */}
      {ordersOpen && (
        <div className="overlay">
          <section className="modal orders-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">YOUR FOOD JOURNEY</span>
                <h2>Order updates</h2>
              </div>
              <button className="close-btn" onClick={() => setOrdersOpen(false)}>
                <X />
              </button>
            </div>

            {lastOrder && (
              <div className="order-success">
                <CheckCircle2 size={23} />
                <div>
                  <b>Order placed!</b>
                  <small>
                    Order #{String(lastOrder._id).slice(-7)} • {lastOrder.status}
                  </small>
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="empty">
                <PackageCheck size={32} />
                <p>No orders to show yet. Place your first order!</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <article className="order-card" key={order._id}>
                    <div>
                      <b>Order #{String(order._id).slice(-7)}</b>
                      <span className="status-pill">{order.status || "Placed"}</span>
                    </div>

                    <p>
                      {(order.items || [])
                        .map(item => `${item.name} ×${item.quantity}`)
                        .join(", ")}
                    </p>

                    <div className="order-foot">
                      <span>
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : "Demo online payment"}
                      </span>
                      <strong>{money(order.total)}</strong>
                    </div>

                    <small>Delivery to: {order.address}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ADMIN ORDERS */}
      {adminOrdersOpen && (
        <div className="overlay">
          <section className="modal orders-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">ADMIN DASHBOARD</span>
                <h2>Customer Orders ({adminOrders.length})</h2>
              </div>
              <button
                className="close-btn"
                onClick={() => setAdminOrdersOpen(false)}
              >
                <X />
              </button>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={loadAdminOrders}
              disabled={adminOrdersLoading}
            >
              {adminOrdersLoading ? "Refreshing..." : "Refresh orders"}
            </button>

            {adminOrdersLoading && adminOrders.length === 0 ? (
              <p>Loading orders...</p>
            ) : adminOrders.length === 0 ? (
              <div className="empty">
                <PackageCheck size={32} />
                <p>No orders found.</p>
              </div>
            ) : (
              <div className="orders-list">
                {adminOrders.map(order => (
                  <article className="order-card" key={order._id}>
                    <div>
                      <b>Order #{String(order._id).slice(-7)}</b>
                      <span className="status-pill">
                        {order.status || "Placed"}
                      </span>
                    </div>

                    <p>
                      Customer: {order.user?.name || "Customer"}
                      {order.user?.email ? ` (${order.user.email})` : ""}
                    </p>

                    <p>
                      {(order.items || [])
                        .map(item => `${item.name} ×${item.quantity}`)
                        .join(", ")}
                    </p>

                    <p>Address: {order.address || "Not provided"}</p>
                    <p>Phone: {order.phone || "Not provided"}</p>

                    <div className="order-foot">
                      <span>
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : "Online payment (demo)"}
                        {" · "}Payment: {order.paymentStatus || "pending"}
                      </span>
                      <strong>{money(order.total)}</strong>
                    </div>

                    <label className="admin-status-control">
                      Update order status:
                      <select
                        value={order.status || "Placed"}
                        disabled={updatingOrderId === order._id}
                        onChange={event =>
                          updateOrderStatus(order._id, event.target.value)
                        }
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    {updatingOrderId === order._id && (
                      <small>Saving status...</small>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ADMIN: ADD MENU ITEM */}
      {adminOpen && (
        <div className="overlay">
          <section className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">MENU MANAGEMENT</span>
                <h2>Add food item</h2>
              </div>
              <button className="close-btn" onClick={() => setAdminOpen(false)}>
                <X />
              </button>
            </div>

            <form className="checkout-form" onSubmit={addMenuItem}>
              <label>
                Food name
                <input
                  required
                  value={adminForm.name}
                  onChange={event =>
                    setAdminForm(old => ({ ...old, name: event.target.value }))
                  }
                />
              </label>

              <label>
                Category
                <select
                  value={adminForm.category}
                  onChange={event =>
                    setAdminForm(old => ({
                      ...old,
                      category: event.target.value
                    }))
                  }
                >
                  {categories.filter(item => item !== "All").map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Price (₹)
                <input
                  type="number"
                  min="1"
                  required
                  value={adminForm.price}
                  onChange={event =>
                    setAdminForm(old => ({ ...old, price: event.target.value }))
                  }
                />
              </label>

              <label>
                Description
                <input
                  value={adminForm.description}
                  onChange={event =>
                    setAdminForm(old => ({
                      ...old,
                      description: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Image URL
                <input
                  value={adminForm.image}
                  onChange={event =>
                    setAdminForm(old => ({ ...old, image: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="file-label">
                <ImagePlus size={17} /> Upload food photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={uploadImage}
                />
              </label>

              <label className="check-label">
                <input
                  type="checkbox"
                  checked={adminForm.vegetarian}
                  onChange={event =>
                    setAdminForm(old => ({
                      ...old,
                      vegetarian: event.target.checked
                    }))
                  }
                />
                Vegetarian
              </label>

              <button className="primary-btn full" disabled={busy}>
                Save menu item
              </button>
            </form>
          </section>
        </div>
      )}

      {user?.role === "admin" && (
        <button
          className="admin-fab"
          onClick={() => setAdminOpen(true)}
          title="Add food item"
        >
          ＋
        </button>
      )}
    </div>
  );
}
