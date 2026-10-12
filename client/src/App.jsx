import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "lucide-react";

const API = axios.create({
  baseURL: "https://inventory-billing-api-jgdf.onrender.com/api"
});
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));
const date = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const blankContact = { name: "", email: "", phone: "", address: "" };
const navItems = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["products", "Products", Package],
  ["sales", "Sales & Billing", ShoppingCart],
  ["purchases", "Purchases", ClipboardList],
  ["customers", "Customers", Users],
  ["suppliers", "Suppliers", Truck],
];

function setToken(token) {
  if (token) {
    localStorage.setItem("ib_token", token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("ib_token");
    delete API.defaults.headers.common.Authorization;
  }
}
const storedToken = localStorage.getItem("ib_token");
if (storedToken)
  API.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

function App() {
  const [token, setAuthToken] = useState(storedToken);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ib_user") || "null");
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState(() => {
  return localStorage.getItem("ib_page") || "dashboard";
});
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  
useEffect(() => {
  localStorage.setItem("ib_page", page);
}, [page]);


  const notify = (message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3800);
  };
  const login = (data) => {
    setToken(data.token);
    localStorage.setItem("ib_user", JSON.stringify(data.user));
    setAuthToken(data.token);
    setUser(data.user);
    setPage("dashboard");
  };
  const logout = () => {
    setToken(null);
    localStorage.removeItem("ib_user");
    setAuthToken(null);
    setUser(null);
  };
  useEffect(() => {
    const id = API.interceptors.response.use(
      (r) => r,
      (e) => {
        if (e.response?.status === 401 && token) {
          logout();
        }
        return Promise.reject(e);
      },
    );
    return () => API.interceptors.response.eject(id);
  }, [token]);

  
if (!token)
  return (
    <AuthScreen
      onLogin={login}
      notify={notify}
      notice={notice}
      setNotice={setNotice}
    />
  );

  const title = navItems.find((n) => n[0] === page)?.[1] || "Dashboard";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Boxes size={23} />
          </div>
          <div>
            <b>StockPilot</b>
            <small>INVENTORY SUITE</small>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => {
                setPage(id);
                setSearch("");
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "sales" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Activity size={17} />
            </div>
            <b>Business overview</b>
            <p>Track stock, sales and purchases in one place.</p>
            <button onClick={() => setPage("dashboard")}>
              View dashboard <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-text">
              <b>{user?.name || "User"}</b>
              <small>{user?.email || "Signed in"}</small>
            </div>
            <button className="icon-button" title="Log out" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <div className="scrim" onClick={() => setMobileNav(false)} />
      )}
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="eyebrow">INVENTORY MANAGEMENT</div>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <span /> System online
            </div>
            <div className="top-avatar">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        {notice && (
          <div className={`toast ${notice.type}`}>
            <span>
              {notice.type === "success" ? (
                <Check size={17} />
              ) : (
                <AlertTriangle size={17} />
              )}
            </span>
            {notice.message}
            <button className="icon-button" onClick={() => setNotice(null)}>
              <X size={15} />
            </button>
          </div>
        )}
        <div className="page-content">
          {page === "dashboard" && (
            <Dashboard key={refresh} notify={notify} onNavigate={setPage} />
          )}
          {page === "products" && (
            <Products
              key={refresh}
              search={search}
              setSearch={setSearch}
              notify={notify}
              onChanged={() => setRefresh((x) => x + 1)}
            />
          )}
          {page === "customers" && (
            <Contacts
              kind="customers"
              title="Customers"
              key={refresh}
              search={search}
              setSearch={setSearch}
              notify={notify}
              onChanged={() => setRefresh((x) => x + 1)}
            />
          )}
          {page === "suppliers" && (
            <Contacts
              kind="suppliers"
              title="Suppliers"
              key={refresh}
              search={search}
              setSearch={setSearch}
              notify={notify}
              onChanged={() => setRefresh((x) => x + 1)}
            />
          )}
          {page === "sales" && (
            <Transactions
              kind="sales"
              title="Sales & Billing"
              key={refresh}
              notify={notify}
              onChanged={() => setRefresh((x) => x + 1)}
            />
          )}
          {page === "purchases" && (
            <Transactions
              kind="purchases"
              title="Purchases"
              key={refresh}
              notify={notify}
              onChanged={() => setRefresh((x) => x + 1)}
            />
          )}
        </div>
        <footer className="footer">
          <span>© {new Date().getFullYear()} StockPilot</span>
          <span>
            Inventory & Billing Management System <i>•</i> React + Node.js +
            MongoDB
          </span>
        </footer>
      </main>
    </div>
  );
}

function AuthScreen({ onLogin, notify, notice, setNotice }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const { data } = await API.post(
        `/auth/${mode === "login" ? "login" : "register"}`,
        form,
      );

      onLogin(data);
    } catch (err) {
      const message = err.response?.data?.message;

      if (mode === "login" && err.response?.status === 401) {
        notify("Incorrect email or password. Please try again.", "error");
      } else {
        notify(
          message ||
            "Could not connect to the API. Make sure the backend and MongoDB are running.",
          "error",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-icon">
            <Boxes size={24} />
          </div>
          <b>StockPilot</b>
        </div>
        <div className="auth-hero">
          <div className="auth-tag">
            <span /> INVENTORY. SIMPLIFIED.
          </div>
          <h1>
            Know your stock.
            <br />
            <em>Grow your business.</em>
          </h1>
          <p>
            A smarter way to manage inventory, record purchases, create bills,
            and understand your business performance.
          </p>
          <div className="preview-card">
            <div className="preview-top">
              <span>BUSINESS SNAPSHOT</span>
              <ChartNoAxesCombined size={17} />
            </div>
            <div className="preview-metrics">
              <div>
                <small>Stock visibility</small>
                <b>Real-time</b>
              </div>
              <div>
                <small>Sales workflow</small>
                <b>Connected</b>
              </div>
            </div>
            <div className="preview-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="preview-caption">
              <span>
                <b /> Inventory tracking
              </span>
              <span>
                <b /> Billing & reports
              </span>
            </div>
          </div>
        </div>
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
      </div>
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-brand">
            <div className="brand-icon">
              <Boxes size={22} />
            </div>
            <b>StockPilot</b>
          </div>
          <div className="eyebrow">YOUR BUSINESS WORKSPACE</div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in to continue to your dashboard."
              : "Set up an account to get started."}
          </p>
          {mode === "register" && (
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="e.g. Saurav Kumar"
                required
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              placeholder={
                mode === "register"
                  ? "At least 6 characters"
                  : "Enter your password"
              }
              minLength={6}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          <button className="btn primary auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}{" "}
            <ArrowUpRight size={17} />
          </button>
          <div className="auth-switch">
            {mode === "login"
              ? "New to StockPilot?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>
          <div className="auth-security">
            <span>
              <Check size={14} />
            </span>{" "}
            Passwords are securely hashed before storage.
          </div>
        </form>
        <div className="auth-footer">Inventory & Billing Management System</div>
      </div>
      {notice && (
        <div className={`toast ${notice.type}`}>
          <span>
            {notice.type === "success" ? (
              <Check size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
          </span>
          {notice.message}
          <button
            className="icon-button"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ notify, onNavigate }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    API.get("/dashboard")
      .then((r) => setData(r.data))
      .catch((e) =>
        notify(
          e.response?.data?.message || "Could not load dashboard.",
          "error",
        ),
      );
  }, []);
  if (!data) return <Loading />;
  const s = data.stats;
  const cards = [
    {
      label: "Total sales",
      value: money(s.totalSales),
      note: `${money(s.monthSales)} this month`,
      icon: CircleDollarSign,
      color: "blue",
    },
    {
      label: "Estimated profit",
      value: money(s.estimatedProfit),
      note: "Based on recorded cost prices",
      icon: ChartNoAxesCombined,
      color: "green",
    },
    {
      label: "Inventory value",
      value: money(s.inventoryValue),
      note: "At current cost prices",
      icon: Boxes,
      color: "purple",
    },
    {
      label: "Low-stock items",
      value: s.lowStockCount,
      note: "At or below reorder level",
      icon: AlertTriangle,
      color: "orange",
    },
  ];
  return (
    <div className="stack-lg">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
          <h2>Good business starts with clarity.</h2>
          <p className="muted">
            Here’s what’s happening across your inventory today.
          </p>
        </div>
        <div className="date-chip">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-top">
              <span>{c.label}</span>
              <div className={`stat-icon ${c.color}`}>
                <c.icon size={19} />
              </div>
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-note">{c.note}</div>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Quick actions</h3>
              <p>Get straight to the task at hand.</p>
            </div>
            <Activity size={18} />
          </div>
          <div className="quick-grid">
            <button onClick={() => onNavigate("products")}>
              <span className="quick-icon q-blue">
                <Plus size={19} />
              </span>
              <b>Add product</b>
              <small>Update your catalogue</small>
              <ArrowUpRight className="quick-arrow" size={16} />
            </button>
            <button onClick={() => onNavigate("sales")}>
              <span className="quick-icon q-green">
                <ShoppingCart size={19} />
              </span>
              <b>Create a bill</b>
              <small>Record a customer sale</small>
              <ArrowUpRight className="quick-arrow" size={16} />
            </button>
            <button onClick={() => onNavigate("purchases")}>
              <span className="quick-icon q-purple">
                <ArrowDownLeft size={19} />
              </span>
              <b>Record purchase</b>
              <small>Restock products</small>
              <ArrowUpRight className="quick-arrow" size={16} />
            </button>
            <button onClick={() => onNavigate("customers")}>
              <span className="quick-icon q-orange">
                <Users size={19} />
              </span>
              <b>Add customer</b>
              <small>Manage your contacts</small>
              <ArrowUpRight className="quick-arrow" size={16} />
            </button>
          </div>
          <div className="panel-subheading">
            <h3>Recent sales</h3>
            <button className="text-button" onClick={() => onNavigate("sales")}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          {data.recentSales.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((x) => (
                    <tr key={x._id}>
                      <td>
                        <span className="strong-cell">{x.invoiceNumber}</span>
                      </td>
                      <td>{x.customerName}</td>
                      <td>{date(x.createdAt)}</td>
                      <td className="strong-cell">{money(x.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={FileText}
              title="No sales yet"
              text="Create your first bill to see it here."
            />
          )}
        </section>
        <section className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h3>Stock attention</h3>
              <p>Items at or below reorder level.</p>
            </div>
            <span className="count-pill">{data.lowStock.length} items</span>
          </div>
          {data.lowStock.length ? (
            <div className="stock-list">
              {data.lowStock.map((p) => (
                <div className="stock-row" key={p._id}>
                  <div className="product-avatar">
                    <Package size={17} />
                  </div>
                  <div className="stock-info">
                    <b>{p.name}</b>
                    <small>
                      {p.sku} · {p.category}
                    </small>
                  </div>
                  <div className="stock-qty">
                    <b>{p.quantity}</b>
                    <small>in stock</small>
                  </div>
                  <span className="warning-tag">Low</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="all-good">
              <span>
                <Check size={20} />
              </span>
              <b>Stock looks healthy</b>
              <p>No items are currently below their reorder level.</p>
            </div>
          )}
          <button
            className="btn secondary full"
            onClick={() => onNavigate("products")}
          >
            Manage inventory <ArrowUpRight size={15} />
          </button>
          <div className="mini-summary">
            <div>
              <small>Products</small>
              <b>{s.productCount}</b>
            </div>
            <div>
              <small>Customers</small>
              <b>{s.customerCount}</b>
            </div>
            <div>
              <small>Suppliers</small>
              <b>{s.supplierCount}</b>
            </div>
            <div>
              <small>Purchases</small>
              <b>{money(s.totalPurchases)}</b>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Products({ search, setSearch, notify, onChanged }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = {
    name: "",
    sku: "",
    category: "General",
    costPrice: "",
    sellingPrice: "",
    quantity: 0,
    reorderLevel: 5,
  };
  const [form, setForm] = useState(empty);
  const load = () =>
    API.get("/products")
      .then((r) => setItems(r.data))
      .catch((e) =>
        notify(
          e.response?.data?.message || "Could not load products.",
          "error",
        ),
      );
  useEffect(() => {
    load();
  }, []);
  const filtered = items.filter((p) =>
    `${p.name} ${p.sku} ${p.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const start = (p) => {
    setEditing(p || null);
    setForm(
      p
        ? { ...p, costPrice: p.costPrice, sellingPrice: p.sellingPrice }
        : empty,
    );
    setOpen(true);
  };
  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
    };
    try {
      if (editing) await API.put(`/products/${editing._id}`, payload);
      else await API.post("/products", payload);
      notify(editing ? "Product updated." : "Product added.");
      setOpen(false);
      load();
      onChanged();
    } catch (err) {
      notify(err.response?.data?.message || "Could not save product.", "error");
    }
  }
  async function remove(p) {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      await API.delete(`/products/${p._id}`);
      notify("Product deleted.");
      load();
      onChanged();
    } catch (e) {
      notify(e.response?.data?.message || "Could not delete product.", "error");
    }
  }
  return (
    <div className="stack-lg">
      <div className="section-intro">
        <div>
          <h2>Product catalogue</h2>
          <p>Keep your products, pricing and stock levels up to date.</p>
        </div>
        <button className="btn primary" onClick={() => start(null)}>
          <Plus size={17} /> Add product
        </button>
      </div>
      <div className="toolbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU or category…"
          />
        </div>
        <span className="result-count">{filtered.length} products</span>
      </div>
      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost price</th>
                <th>Selling price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-avatar">
                        <Package size={16} />
                      </div>
                      <b>{p.name}</b>
                    </div>
                  </td>
                  <td>
                    <span className="code-pill">{p.sku}</span>
                  </td>
                  <td>{p.category}</td>
                  <td>{money(p.costPrice)}</td>
                  <td className="strong-cell">{money(p.sellingPrice)}</td>
                  <td>
                    <span
                      className={`stock-pill ${p.quantity <= p.reorderLevel ? "low" : "ok"}`}
                    >
                      {p.quantity} units
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="small-action" onClick={() => start(p)}>
                        Edit
                      </button>
                      <button
                        className="small-action danger-text"
                        onClick={() => remove(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty
              icon={Package}
              title="No products found"
              text="Add a product or adjust your search."
            />
          )}
        </div>
      </div>
      {open && (
        <Modal
          title={editing ? "Edit product" : "Add product"}
          onClose={() => setOpen(false)}
        >
          <form className="form-grid" onSubmit={save}>
            <label className="span-2">
              Product name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wireless mouse"
              />
            </label>
            <label>
              SKU / code
              <input
                required
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value.toUpperCase() })
                }
                placeholder="e.g. ACC-001"
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Accessories"
              />
            </label>
            <label>
              Cost price (₹)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.costPrice}
                onChange={(e) =>
                  setForm({ ...form, costPrice: e.target.value })
                }
              />
            </label>
            <label>
              Selling price (₹)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: e.target.value })
                }
              />
            </label>
            <label>
              Opening stock
              <input
                required
                min="0"
                step="1"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>
            <label>
              Low-stock threshold
              <input
                required
                min="0"
                step="1"
                type="number"
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm({ ...form, reorderLevel: e.target.value })
                }
              />
            </label>
            <div className="modal-actions span-2">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary">
                {editing ? "Save changes" : "Add product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Contacts({ kind, title, search, setSearch, notify, onChanged }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankContact);
  const load = () =>
    API.get(`/${kind}`)
      .then((r) => setItems(r.data))
      .catch((e) =>
        notify(
          e.response?.data?.message || `Could not load ${title.toLowerCase()}.`,
          "error",
        ),
      );
  useEffect(() => {
    load();
  }, []);
  const filtered = items.filter((x) =>
    `${x.name} ${x.email} ${x.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const start = (x) => {
    setEditing(x || null);
    setForm(
      x
        ? { name: x.name, email: x.email, phone: x.phone, address: x.address }
        : blankContact,
    );
    setOpen(true);
  };
  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await API.put(`/${kind}/${editing._id}`, form);
      else await API.post(`/${kind}`, form);
      notify(`${title.slice(0, -1)} ${editing ? "updated" : "added"}.`);
      setOpen(false);
      load();
      onChanged();
    } catch (e) {
      notify(e.response?.data?.message || "Could not save record.", "error");
    }
  }
  async function remove(x) {
    if (!confirm(`Delete ${x.name}?`)) return;
    try {
      await API.delete(`/${kind}/${x._id}`);
      notify("Record deleted.");
      load();
      onChanged();
    } catch (e) {
      notify(e.response?.data?.message || "Could not delete record.", "error");
    }
  }
  const Icon = kind === "customers" ? Users : Truck;
  return (
    <div className="stack-lg">
      <div className="section-intro">
        <div>
          <h2>
            {kind === "customers" ? "Customer directory" : "Supplier directory"}
          </h2>
          <p>Store contact details for smoother day-to-day operations.</p>
        </div>
        <button className="btn primary" onClick={() => start(null)}>
          <Plus size={17} /> Add{" "}
          {kind === "customers" ? "customer" : "supplier"}
        </button>
      </div>
      <div className="toolbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
          />
        </div>
        <span className="result-count">{filtered.length} records</span>
      </div>
      <div className="contact-grid">
        {filtered.map((x) => (
          <div className="contact-card" key={x._id}>
            <div className="contact-card-top">
              <div className="contact-avatar">
                <Icon size={20} />
              </div>
              <div className="contact-actions">
                <button className="small-action" onClick={() => start(x)}>
                  Edit
                </button>
                <button
                  className="small-action danger-text"
                  onClick={() => remove(x)}
                >
                  Delete
                </button>
              </div>
            </div>
            <h3>{x.name}</h3>
            <div className="contact-detail">
              {x.email || "No email provided"}
            </div>
            <div className="contact-detail">
              {x.phone || "No phone provided"}
            </div>
            <div className="contact-address">
              {x.address || "No address provided"}
            </div>
            <div className="contact-card-foot">
              <span className="status-indicator">
                <i /> Saved record
              </span>
              <small>Added {date(x.createdAt)}</small>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel">
          <Empty
            icon={Icon}
            title={`No ${title.toLowerCase()} yet`}
            text="Add a record to keep your business contacts organized."
          />
        </div>
      )}
      {open && (
        <Modal
          title={`${editing ? "Edit" : "Add"} ${kind === "customers" ? "customer" : "supplier"}`}
          onClose={() => setOpen(false)}
        >
          <form className="form-grid" onSubmit={save}>
            <label className="span-2">
              Full name / business name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter name"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>
            <label>
              Phone number
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91…"
              />
            </label>
            <label className="span-2">
              Address
              <textarea
                rows="3"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, city, PIN code"
              />
            </label>
            <div className="modal-actions span-2">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary">
                {editing ? "Save changes" : "Save record"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Transactions({ kind, title, notify, onChanged }) {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    contact: "",
    paymentMethod: "Cash",
    discount: 0,
    taxRate: 0,
    notes: "",
    lines: [{ product: "", quantity: 1, unitPrice: "" }],
  });
  const isSale = kind === "sales";
  const contactKey = isSale ? "customer" : "supplier";
  const contactLabel = isSale ? "Customer" : "Supplier";
  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([
        API.get(`/${kind}`),
        API.get("/products"),
        API.get(`/${isSale ? "customers" : "suppliers"}`),
      ]);
      setItems(a.data);
      setProducts(b.data);
      setContacts(c.data);
    } catch (e) {
      notify(
        e.response?.data?.message || `Could not load ${title.toLowerCase()}.`,
        "error",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const filtered = items.filter((x) =>
    `${x.invoiceNumber || x.purchaseNumber} ${x.customerName || x.supplierName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const selectedLines = form.lines.map((line) => {
    const product = products.find((p) => p._id === line.product);
    return {
      ...line,
      productData: product,
      quantity: Number(line.quantity || 0),
      unitPrice:
        line.unitPrice === ""
          ? Number(
              isSale ? product?.sellingPrice || 0 : product?.costPrice || 0,
            )
          : Number(line.unitPrice || 0),
    };
  });
  const subtotal = selectedLines.reduce(
    (s, x) => s + x.quantity * x.unitPrice,
    0,
  );
  const discount = isSale ? Number(form.discount || 0) : 0;
  const taxRate = isSale ? Number(form.taxRate || 0) : 0;
  const total = Math.max(0, subtotal - discount) * (1 + taxRate / 100);
  function updateLine(index, key, value) {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [key]: value };
        if (key === "product") {
          const p = products.find((x) => x._id === value);
          next.unitPrice = p
            ? String(isSale ? p.sellingPrice : p.costPrice)
            : "";
        }
        return next;
      }),
    }));
  }
  function start() {
    setForm({
      contact: "",
      paymentMethod: "Cash",
      discount: 0,
      taxRate: 0,
      notes: "",
      lines: [{ product: "", quantity: 1, unitPrice: "" }],
    });
    setOpen(true);
  }
  async function save(e) {
    e.preventDefault();
    const lines = form.lines
      .filter((x) => x.product)
      .map((x) => ({
        product: x.product,
        quantity: Number(x.quantity),
        unitPrice: Number(x.unitPrice),
      }));
    if (!lines.length) return notify("Add at least one product.", "error");
    try {
      const payload = {
        [contactKey]: form.contact || null,
        items: lines,
        notes: form.notes,
      };
      if (isSale)
        Object.assign(payload, {
          discount: Number(form.discount),
          taxRate: Number(form.taxRate),
          paymentMethod: form.paymentMethod,
        });
      const { data } = await API.post(`/${kind}`, payload);
      notify(
        `${isSale ? "Sale" : "Purchase"} recorded: ${data.invoiceNumber || data.purchaseNumber}`,
      );
      setOpen(false);
      load();
      onChanged();
    } catch (e) {
      notify(
        e.response?.data?.message ||
          `Could not save ${isSale ? "sale" : "purchase"}.`,
        "error",
      );
    }
  }
  function printInvoice(item) {
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return notify("Allow pop-ups to print invoices.", "error");
    const rows = item.items
      .map(
        (x) =>
          `<tr><td>${escapeHtml(x.name)}<br><small>${escapeHtml(x.sku)}</small></td><td>${x.quantity}</td><td>${money(x.unitPrice)}</td><td>${money(x.lineTotal)}</td></tr>`,
      )
      .join("");
    const num = item.invoiceNumber || item.purchaseNumber;
    w.document.write(
      `<!doctype html><html><head><title>${num}</title><style>body{font:14px Arial;padding:36px;color:#172033}h1{margin-bottom:4px}small{color:#667085}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{background:#f4f6f8}.total{text-align:right;margin-top:24px;font-size:20px;font-weight:bold}.meta{color:#667085}</style></head><body><h1>${isSale ? "Sales Invoice" : "Purchase Record"}</h1><div class="meta">StockPilot · ${date(item.createdAt)}</div><h3>${escapeHtml(num)}</h3><p>${isSale ? "Customer" : "Supplier"}: ${escapeHtml(item.customerName || item.supplierName)}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total: ${money(item.total)}</div>${isSale ? `<p>Subtotal: ${money(item.subtotal)} · Discount: ${money(item.discount)} · Tax: ${money(item.taxAmount)}</p><p>Payment: ${escapeHtml(item.paymentMethod || "—")}</p>` : ""}<p>${escapeHtml(item.notes || "")}</p><script>window.onload=()=>window.print()<\/script></body></html>`,
    );
    w.document.close();
  }
  return (
    <div className="stack-lg">
      <div className="section-intro">
        <div>
          <h2>{isSale ? "Sales & invoices" : "Purchase records"}</h2>
          <p>
            {isSale
              ? "Create bills, record payments and track customer sales."
              : "Record stock received from suppliers and update inventory."}
          </p>
        </div>
        <button className="btn primary" onClick={start}>
          <Plus size={17} />
          {isSale ? "Create bill" : "Record purchase"}
        </button>
      </div>
      <div className="toolbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${isSale ? "invoice or customer" : "purchase or supplier"}…`}
          />
        </div>
        <span className="result-count">{filtered.length} records</span>
      </div>
      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isSale ? "Invoice number" : "Purchase number"}</th>
                <th>{contactLabel}</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>{isSale ? "Payment" : "Document"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x._id}>
                  <td>
                    <span className="strong-cell">
                      {x.invoiceNumber || x.purchaseNumber}
                    </span>
                  </td>
                  <td>{x.customerName || x.supplierName}</td>
                  <td>{date(x.createdAt)}</td>
                  <td>{x.items.reduce((s, y) => s + y.quantity, 0)} units</td>
                  <td className="strong-cell">{money(x.total)}</td>
                  <td>
                    {isSale ? (
                      <span className="payment-pill">{x.paymentMethod}</span>
                    ) : (
                      <button
                        className="small-action"
                        onClick={() => printInvoice(x)}
                      >
                        <Printer size={14} /> Print
                      </button>
                    )}
                    {isSale && (
                      <button
                        className="small-action print-action"
                        onClick={() => printInvoice(x)}
                        title="Print invoice"
                      >
                        <Printer size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty
              icon={isSale ? FileText : ClipboardList}
              title={`No ${isSale ? "sales" : "purchases"} recorded`}
              text={
                isSale
                  ? "Create your first bill to see invoices here."
                  : "Record a purchase to increase your stock."
              }
            />
          )}
        </div>
      </div>
      {open && (
        <Modal
          title={isSale ? "Create sales invoice" : "Record purchase"}
          wide
          onClose={() => setOpen(false)}
        >
          <form onSubmit={save} className="transaction-form">
            <div className="form-grid">
              <label className="span-2">
                {contactLabel}
                <select
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                >
                  <option value="">
                    Walk-in / unspecified {contactLabel.toLowerCase()}
                  </option>
                  {contacts.map((c) => (
                    <option value={c._id} key={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {isSale && (
                <>
                  <label>
                    Discount (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount}
                      onChange={(e) =>
                        setForm({ ...form, discount: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Tax rate (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.taxRate}
                      onChange={(e) =>
                        setForm({ ...form, taxRate: e.target.value })
                      }
                    />
                  </label>
                  <label className="span-2">
                    Payment method
                    <select
                      value={form.paymentMethod}
                      onChange={(e) =>
                        setForm({ ...form, paymentMethod: e.target.value })
                      }
                    >
                      {["Cash", "UPI", "Card", "Bank Transfer", "Credit"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                  </label>
                </>
              )}
            </div>
            <div className="line-items-heading">
              <div>
                <h3>Items</h3>
                <p>Select products and quantities.</p>
              </div>
              <button
                type="button"
                className="btn secondary small-btn"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    lines: [
                      ...f.lines,
                      { product: "", quantity: 1, unitPrice: "" },
                    ],
                  }))
                }
              >
                <Plus size={15} /> Add line
              </button>
            </div>
            <div className="line-items">
              {form.lines.map((line, i) => (
                <div className="line-item" key={i}>
                  <label className="line-product">
                    Product
                    <select
                      required
                      value={line.product}
                      onChange={(e) => updateLine(i, "product", e.target.value)}
                    >
                      <option value="">Choose product…</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} · {p.sku}
                          {isSale ? ` · ${p.quantity} in stock` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Qty
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(i, "quantity", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Unit price (₹)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(i, "unitPrice", e.target.value)
                      }
                    />
                  </label>
                  <div className="line-total">
                    <small>Line total</small>
                    <b>
                      {money(
                        Number(line.quantity || 0) *
                          Number(
                            line.unitPrice ||
                              products.find((p) => p._id === line.product)?.[
                                isSale ? "sellingPrice" : "costPrice"
                              ] ||
                              0,
                          ),
                      )}
                    </b>
                  </div>
                  {form.lines.length > 1 && (
                    <button
                      type="button"
                      className="remove-line"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          lines: f.lines.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <label className="notes-label">
              Notes (optional)
              <textarea
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any relevant notes…"
              />
            </label>
            <div className="totals-box">
              <div>
                <span>Subtotal</span>
                <b>{money(subtotal)}</b>
              </div>
              {isSale && (
                <>
                  <div>
                    <span>Discount</span>
                    <b>− {money(discount)}</b>
                  </div>
                  <div>
                    <span>Tax ({taxRate}%)</span>
                    <b>
                      {money(
                        (Math.max(0, subtotal - discount) * taxRate) / 100,
                      )}
                    </b>
                  </div>
                </>
              )}
              <div className="grand-total">
                <span>Total {isSale ? "due" : "purchase cost"}</span>
                <b>{money(total)}</b>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary">
                {isSale ? "Save & create invoice" : "Save purchase"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }) {
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal ${wide ? "wide" : ""}`}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">STOCKPILOT WORKSPACE</div>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
function Empty({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <div>
        <Icon size={22} />
      </div>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <span className="spinner" />
      <b>Loading your workspace…</b>
      <small>Fetching your latest business data</small>
    </div>
  );
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

export default App;
