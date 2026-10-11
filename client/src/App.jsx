
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

const money = n =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(n || 0);

const categories = ["All", "Burgers", "Pizza", "Chicken", "Healthy", "Sides", "Desserts"];

const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Out for delivery",
  "Delivered",
  "Cancelled"
];

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

  useEffect(() => {
    fetch(`${API}/menu`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data) && data.length) setMenu(data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      menu.filter(
        x =>
          (category === "All" || x.category === category) &&
          `${x.name} ${x.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [menu, category, search]
  );

  const count = cart.reduce((s, x) => s + x.quantity, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 30;
  const total = subtotal + delivery;

  const notify = message => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
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

  const changeQty = (id, delta) =>
    setCart(old =>
      old
        .map(x =>
          x._id === id ? { ...x, quantity: x.quantity + delta } : x
        )
        .filter(x => x.quantity > 0)
    );

  const requestLocation = () => {
    if (!navigator.geolocation) {
      return notify("Geolocation is not supported by this browser.");
    }

    navigator.geolocation.getCurrentPosition(
      pos =>
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })),
      () => notify("Location permission denied. Enter your address manually.")
    );
  };

  const submitAuth = async e => {
    e.preventDefault();
    setBusy(true);

    try {
      const r = await fetch(
        `${API}/auth/${authMode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authForm)
        }
      );

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Could not authenticate");

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("fooddelivery_token", data.token);
      localStorage.setItem("fooddelivery_user", JSON.stringify(data.user));
      setAuthOpen(false);
      notify("Welcome to Food Delivery!");
    } catch (error) {
      notify(error.message || "Could not authenticate.");
    } finally {
      setBusy(false);
    }
  };

  const loadOrders = async () => {
    if (!token) {
      setAuthOpen(true);
      return;
    }

    try {
      const r = await fetch(`${API}/orders/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Could not load orders");

      setOrders(Array.isArray(data) ? data : []);
      setOrdersOpen(true);
    } catch (error) {
      notify(error.message || "Could not load orders. Check server connection.");
    }
  };

  // Admin: load every customer's orders
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
        throw new Error(data.message || "Could not load admin orders");
      }

      setAdminOrders(Array.isArray(data) ? data : []);
      setAdminOrdersOpen(true);
    } catch (error) {
      notify(error.message || "Could not load orders.");
    } finally {
      setAdminOrdersLoading(false);
    }
  };

  // Admin: update an order's status
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

      // Refresh customer order history if the current account owns this order.
      if (user?.role === "customer") {
        loadOrders();
      }
    } catch (error) {
      notify(error.message || "Could not update order status.");
      await loadAdminOrders();
    } finally {
      setUpdatingOrderId("");
    }
  };

  const placeOrder = async e => {
    e.preventDefault();

    if (!cart.length) return;

    if (!token) {
      setCheckoutOpen(false);
      setAuthOpen(true);
      notify("Please log in or register before ordering.");
      return;
    }

    setBusy(true);

    try {
      const r = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(x => ({
            id: x._id,
            quantity: x.quantity
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

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Order failed");

      setLastOrder(data);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      notify("Order placed successfully!");
      setOrdersOpen(true);
      setOrders(old => [data, ...old]);
    } catch (error) {
      notify(
        error.message === "Failed to fetch"
          ? "Start the backend server to place an order."
          : error.message
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
    setAdminOrdersOpen(false);
    setOrdersOpen(false);
    localStorage.removeItem("fooddelivery_user");
    localStorage.removeItem("fooddelivery_token");
    notify("Signed out");
  };

  const uploadImage = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token || user?.role !== "admin") {
      return notify("Sign in with an admin account to upload images.");
    }

    const fd = new FormData();
    fd.append("image", file);

    try {
      const r = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Image upload failed");

      const imageUrl = data.image.startsWith("http")
        ? data.image
        : `http://localhost:5000${data.image}`;

      setAdminForm(f => ({ ...f, image: imageUrl }));
      notify("Image uploaded");
    } catch (error) {
      notify(error.message || "Image upload failed. Check server and admin access.");
    }
  };

  const addMenuItem = async e => {
    e.preventDefault();

    if (!token || user?.role !== "admin") {
      return notify("Admin login required to add menu items.");
    }

    try {
      const r = await fetch(`${API}/admin/menu`, {
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

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Could not add menu item");

      setMenu(old => [data, ...old]);
      setAdminForm({
        name: "",
        category: "Burgers",
        price: "",
        description: "",
        image: "",
        vegetarian: false
      });
      setAdminOpen(false);
      notify("Menu item added");
    } catch (error) {
      notify(error.message || "Could not add menu item");
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon"><Utensils size={22} /></span>
          <span>
            Food <span className="brand-orange">Delivery</span>
            <small>GOOD FOOD. GOOD MOOD.</small>
          </span>
        </a>

        <div className="location">
          <MapPin size={18} />
          <div>
            <small>DELIVERING TO</small>
            <strong>{form.address ? form.address.slice(0, 25) : "Your location"}</strong>
          </div>
          <button className="icon-button" onClick={requestLocation} title="Use my location">
            <LocateFixed size={17} />
          </button>
        </div>

        <div className="header-actions">
          <button className="nav-btn" onClick={loadOrders}>
            <PackageCheck size={17} /> Orders
          </button>

          {user ? (
            <button className="nav-btn" onClick={signOut}>
              <LogOut size={17} /> {user.name?.split(" ")[0] || "Account"}
            </button>
          ) : (
            <button className="nav-btn" onClick={() => setAuthOpen(true)}>
              <UserRound size={17} /> Sign in
            </button>
          )}

          {user?.role === "admin" && (
            <button className="nav-btn" onClick={loadAdminOrders}>
              <PackageCheck size={17} />
              {adminOrdersLoading ? "Loading..." : "Admin Orders"}
            </button>
          )}

          <button className="cart-button" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={19} /> Cart <b>{count}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> FRESH • FAST • DELICIOUS</span>
            <h1>Cravings? We’ve<br />got <em>you covered.</em></h1>
            <p>Restaurant favourites, delivered fresh to your door.</p>
            <button className="primary-btn" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
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
              <div><b>Top pick today</b><small>Classic Cheeseburger</small></div>
              <strong>₹179</strong>
            </div>
            <div className="floating-badge">MADE WITH<br />LOVE <span>♥</span></div>
          </div>
        </section>

        <section className="benefits">
          <div><span className="benefit-icon peach">♨</span><div><b>Freshly prepared</b><small>Made when you order</small></div></div>
          <div><span className="benefit-icon yellow">⌁</span><div><b>Fast delivery</b><small>Hot food, happy mood</small></div></div>
          <div><span className="benefit-icon green">✓</span><div><b>Quality ingredients</b><small>Goodness in every bite</small></div></div>
          <div><span className="benefit-icon purple">♡</span><div><b>Made for you</b><small>Find your new favourite</small></div></div>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your cravings..." />
              {search && <button onClick={() => setSearch("")}><X size={15} /></button>}
            </label>
          </div>

          <div className="categories">
            {categories.map(c => (
              <button key={c} className={category === c ? "category active" : "category"} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="food-grid">
            {filtered.map((item, i) => (
              <article className="food-card" key={item._id}>
                <div className="food-image">
                  <img src={item.image || FALLBACK[i % FALLBACK.length].image} alt={item.name} onError={e => { e.currentTarget.src = FALLBACK[0].image; }} />
                  <span className="food-tag">{item.vegetarian ? "🌱 Veg" : "Chef's pick"}</span>
                  <button className="add-btn" onClick={() => add(item)} aria-label={`Add ${item.name}`}>
                    <Plus size={21} />
                  </button>
                </div>
                <div className="food-info">
                  <div className="food-title">
                    <h3>{item.name}</h3>
                    <span className="rating"><Star size={13} fill="currentColor" />{item.rating || 4.5}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="food-bottom"><strong>{money(item.price)}</strong><span>{item.category}</span></div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && <div className="empty"><Search size={30} /><h3>No bites found</h3><p>Try another search or category.</p></div>}
        </section>

        <section className="promo">
          <div>
            <span className="eyebrow">A LITTLE SOMETHING EXTRA</span>
            <h2>Good things come<br />to those who <em>order.</em></h2>
            <p>Delivery is on us when your order reaches ₹499.</p>
            <button className="primary-btn" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>Find your favourites ↗</button>
          </div>
          <div className="promo-emoji">🍕<span>🍟</span><i>🥤</i></div>
        </section>

        <section className="bottom-note">
          <div><span className="brand-icon"><Utensils size={20} /></span><h3>Food Delivery</h3></div>
          <p>A student-built food delivery demo. Fresh ideas, one order at a time.</p>
          <small>Demo project • Payments are simulated • © 2026 Food Delivery</small>
        </section>
      </main>

      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}

      {cartOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setCartOpen(false)}>
          <aside className="drawer">
            <div className="drawer-head">
              <div><span className="eyebrow">YOUR SELECTION</span><h2>Your cart <span>({count})</span></h2></div>
              <button className="close-btn" onClick={() => setCartOpen(false)}><X /></button>
            </div>

            {!cart.length ? (
              <div className="empty cart-empty">
                <span>🛍️</span><h3>Your cart is hungry</h3><p>Add something delicious to get started.</p>
                <button className="primary-btn" onClick={() => { setCartOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Browse menu</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map(x => (
                    <div className="cart-line" key={x._id}>
                      <img src={x.image} alt={x.name} />
                      <div className="cart-line-info">
                        <b>{x.name}</b><strong>{money(x.price)}</strong>
                        <div className="qty">
                          <button onClick={() => changeQty(x._id, -1)}><Minus size={14} /></button>
                          <span>{x.quantity}</span>
                          <button onClick={() => changeQty(x._id, 1)}><Plus size={14} /></button>
                        </div>
                      </div>
                      <button className="remove-btn" onClick={() => setCart(old => old.filter(y => y._id !== x._id))}><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="bill">
                  <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
                  <div><span>Delivery fee</span><b>{delivery === 0 ? "FREE" : money(delivery)}</b></div>
                  {subtotal > 0 && subtotal < 499 && <small>Add {money(499 - subtotal)} more for free delivery</small>}
                  <div className="bill-total"><span>Total</span><strong>{money(total)}</strong></div>
                  <button className="primary-btn full" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout ↗</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay">
          <section className="modal">
            <div className="modal-head">
              <div><span className="eyebrow">ALMOST THERE</span><h2>Checkout</h2></div>
              <button className="close-btn" onClick={() => setCheckoutOpen(false)}><X /></button>
            </div>
            <form onSubmit={placeOrder} className="checkout-form">
              <label>Delivery address<textarea required minLength="8" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Flat / house, street, area, city" /></label>
              <button type="button" className="location-btn" onClick={requestLocation}><LocateFixed size={17} />{form.lat != null ? "Location attached" : "Use my current location"}</button>
              <label>Phone number<input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your contact number" inputMode="tel" minLength="8" /></label>
              <label>Payment method<select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}><option value="COD">Cash on Delivery</option><option value="DEMO_ONLINE">Online payment (demo simulation)</option></select></label>
              {form.paymentMethod === "DEMO_ONLINE" && <div className="demo-warning">Demo only: no real money is charged. Do not enter card details.</div>}
              <div className="checkout-total"><span>Total payable</span><strong>{money(total)}</strong></div>
              <button className="primary-btn full" disabled={busy}>{busy ? "Placing order..." : `Place order • ${money(total)}`}</button>
            </form>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="overlay">
          <section className="modal auth-modal">
            <div className="modal-head">
              <div><span className="eyebrow">WELCOME TO FOOD DELIVERY</span><h2>{authMode === "login" ? "Good to see you" : "Create account"}</h2></div>
              <button className="close-btn" onClick={() => setAuthOpen(false)}><X /></button>
            </div>
            <form className="checkout-form" onSubmit={submitAuth}>
              {authMode === "register" && <label>Full name<input required value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" /></label>}
              <label>Email address<input type="email" required value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" /></label>
              <label>Password<input type="password" minLength="6" required value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" /></label>
              <button className="primary-btn full" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
            </form>
            <p className="switch-auth">{authMode === "login" ? "New here?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p>
          </section>
        </div>
      )}

      {ordersOpen && (
        <div className="overlay">
          <section className="modal orders-modal">
            <div className="modal-head">
              <div><span className="eyebrow">YOUR FOOD JOURNEY</span><h2>Order updates</h2></div>
              <button className="close-btn" onClick={() => setOrdersOpen(false)}><X /></button>
            </div>
            {lastOrder && <div className="order-success"><CheckCircle2 size={23} /><div><b>Order placed!</b><small>Order #{String(lastOrder._id).slice(-7)} • {lastOrder.status}</small></div></div>}
            {orders.length === 0 ? <div className="empty"><PackageCheck size={32} /><p>No orders to show yet. Place your first order!</p></div> : (
              <div className="orders-list">
                {orders.map(o => (
                  <article className="order-card" key={o._id}>
                    <div><b>Order #{String(o._id).slice(-7)}</b><span className="status-pill">{o.status}</span></div>
                    <p>{(o.items || []).map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                    <div className="order-foot"><span>{o.paymentMethod === "COD" ? "Cash on Delivery" : "Demo online payment"}</span><strong>{money(o.total)}</strong></div>
                    <small>Delivery to: {o.address}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {adminOrdersOpen && (
        <div className="overlay">
          <section className="modal orders-modal">
            <div className="modal-head">
              <div><span className="eyebrow">ADMIN DASHBOARD</span><h2>Customer Orders ({adminOrders.length})</h2></div>
              <button className="close-btn" onClick={() => setAdminOrdersOpen(false)}><X /></button>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={loadAdminOrders}
              disabled={adminOrdersLoading}
            >
              {adminOrdersLoading ? "Refreshing..." : "Refresh orders"}
            </button>

            {adminOrdersLoading && adminOrders.length === 0 ? <p>Loading orders...</p> : adminOrders.length === 0 ? (
              <div className="empty"><PackageCheck size={32} /><p>No orders found.</p></div>
            ) : (
              <div className="orders-list">
                {adminOrders.map(order => (
                  <article className="order-card" key={order._id}>
                    <div>
                      <b>Order #{String(order._id).slice(-7)}</b>
                      <span className="status-pill">{order.status || "Placed"}</span>
                    </div>
                    <p>Customer: {order.user?.name || "Customer"}{order.user?.email ? ` (${order.user.email})` : ""}</p>
                    <p>{(order.items || []).map(item => `${item.name} ×${item.quantity}`).join(", ")}</p>
                    <p>Address: {order.address || "Not provided"}</p>
                    <p>Phone: {order.phone || "Not provided"}</p>
                    <div className="order-foot">
                      <span>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment (demo)"} · Payment: {order.paymentStatus || "pending"}</span>
                      <strong>{money(order.total)}</strong>
                    </div>

                    <label className="admin-status-control">
                      Update order status:
                      <select
                        value={order.status || "Placed"}
                        disabled={updatingOrderId === order._id}
                        onChange={e => updateOrderStatus(order._id, e.target.value)}
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    {updatingOrderId === order._id && <small>Saving status...</small>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {adminOpen && (
        <div className="overlay">
          <section className="modal">
            <div className="modal-head">
              <div><span className="eyebrow">MENU MANAGEMENT</span><h2>Add food item</h2></div>
              <button className="close-btn" onClick={() => setAdminOpen(false)}><X /></button>
            </div>
            <form className="checkout-form" onSubmit={addMenuItem}>
              <label>Food name<input required value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} /></label>
              <label>Category<select value={adminForm.category} onChange={e => setAdminForm(f => ({ ...f, category: e.target.value }))}>{categories.filter(x => x !== "All").map(c => <option key={c}>{c}</option>)}</select></label>
              <label>Price (₹)<input type="number" min="1" required value={adminForm.price} onChange={e => setAdminForm(f => ({ ...f, price: e.target.value }))} /></label>
              <label>Description<input value={adminForm.description} onChange={e => setAdminForm(f => ({ ...f, description: e.target.value }))} /></label>
              <label>Image URL<input value={adminForm.image} onChange={e => setAdminForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." /></label>
              <label className="file-label"><ImagePlus size={17} /> Upload food photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} /></label>
              <label className="check-label"><input type="checkbox" checked={adminForm.vegetarian} onChange={e => setAdminForm(f => ({ ...f, vegetarian: e.target.checked }))} /> Vegetarian</label>
              <button className="primary-btn full">Save menu item</button>
            </form>
          </section>
        </div>
      )}

      {user?.role === "admin" && (
        <button className="admin-fab" onClick={() => setAdminOpen(true)} title="Add food item">＋</button>
      )}
    </div>
  );
}
