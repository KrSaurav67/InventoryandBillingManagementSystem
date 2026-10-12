require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  category: { type: String, default: "General", trim: true },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 5, min: 0 }
}, { timestamps: true });

const contactFields = {
  name: { type: String, required: true, trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "", trim: true }
};
const customerSchema = new Schema(contactFields, { timestamps: true });
const supplierSchema = new Schema(contactFields, { timestamps: true });

const lineSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new Schema({
  invoiceNumber: { type: String, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  customerName: { type: String, default: "Walk-in customer" },
  items: { type: [lineSchema], validate: v => v.length > 0 },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  estimatedProfit: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["Cash", "UPI", "Card", "Bank Transfer", "Credit"], default: "Cash" },
  notes: { type: String, default: "" }
}, { timestamps: true });

const purchaseSchema = new Schema({
  purchaseNumber: { type: String, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
  supplierName: { type: String, default: "Unspecified supplier" },
  items: { type: [lineSchema], validate: v => v.length > 0 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: { type: String, default: "" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Customer = mongoose.model("Customer", customerSchema);
const Supplier = mongoose.model("Supplier", supplierSchema);
const Sale = mongoose.model("Sale", saleSchema);
const Purchase = mongoose.model("Purchase", purchaseSchema);

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development_secret_change_me");
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
function number(value, label, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) throw Object.assign(new Error(`${label} must be a valid number greater than or equal to ${min}.`), { status: 400 });
  return n;
}
function makeNumber(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Inventory & Billing API" }));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email || password.length < 6) {
    return res.status(400).json({ message: "Name, valid email, and a password of at least 6 characters are required." });
  }
  if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists." });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Incorrect email or password." });
  const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
}));

app.use("/api", auth);

app.get("/api/products", asyncRoute(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const filter = q ? { $or: [{ name: new RegExp(escapeRegex(q), "i") }, { sku: new RegExp(escapeRegex(q), "i") }, { category: new RegExp(escapeRegex(q), "i") }] } : {};
  res.json(await Product.find(filter).sort({ createdAt: -1 }));
}));
app.post("/api/products", asyncRoute(async (req, res) => {
  const body = req.body;
  const product = await Product.create({
    name: String(body.name || "").trim(), sku: String(body.sku || "").trim().toUpperCase(),
    category: String(body.category || "General").trim(),
    costPrice: number(body.costPrice, "Cost price"), sellingPrice: number(body.sellingPrice, "Selling price"),
    quantity: number(body.quantity ?? 0, "Quantity"), reorderLevel: number(body.reorderLevel ?? 5, "Reorder level")
  });
  res.status(201).json(product);
}));
app.put("/api/products/:id", asyncRoute(async (req, res) => {
  const b = req.body;
  const updated = await Product.findByIdAndUpdate(req.params.id, {
    name: String(b.name || "").trim(), sku: String(b.sku || "").trim().toUpperCase(),
    category: String(b.category || "General").trim(),
    costPrice: number(b.costPrice, "Cost price"), sellingPrice: number(b.sellingPrice, "Selling price"),
    quantity: number(b.quantity, "Quantity"), reorderLevel: number(b.reorderLevel, "Reorder level")
  }, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: "Product not found." });
  res.json(updated);
}));
app.delete("/api/products/:id", asyncRoute(async (req, res) => {
  const used = await Promise.all([Sale.exists({ "items.product": req.params.id }), Purchase.exists({ "items.product": req.params.id })]);
  if (used.some(Boolean)) return res.status(409).json({ message: "This product has transaction history and cannot be deleted. Set its quantity to zero instead." });
  const result = await Product.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ message: "Product not found." });
  res.json({ message: "Product deleted." });
}));

async function contactRoutes(path, Model) {
  app.get(`/api/${path}`, asyncRoute(async (_req, res) => res.json(await Model.find().sort({ createdAt: -1 }))));
  app.post(`/api/${path}`, asyncRoute(async (req, res) => {
    const doc = await Model.create({
      name: String(req.body.name || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
      phone: String(req.body.phone || "").trim(),
      address: String(req.body.address || "").trim()
    });
    res.status(201).json(doc);
  }));
  app.put(`/api/${path}/:id`, asyncRoute(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, {
      name: String(req.body.name || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
      phone: String(req.body.phone || "").trim(),
      address: String(req.body.address || "").trim()
    }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: `${path} record not found.` });
    res.json(doc);
  }));
  app.delete(`/api/${path}/:id`, asyncRoute(async (req, res) => {
    const result = await Model.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: `${path} record not found.` });
    res.json({ message: "Record deleted." });
  }));
}
contactRoutes("customers", Customer);
contactRoutes("suppliers", Supplier);

app.get("/api/sales", asyncRoute(async (_req, res) => res.json(await Sale.find().sort({ createdAt: -1 }).limit(300))));
app.post("/api/sales", asyncRoute(async (req, res) => {
  const b = req.body;
  if (!Array.isArray(b.items) || b.items.length === 0) return res.status(400).json({ message: "Add at least one item to the sale." });
  const customer = b.customer ? await Customer.findById(b.customer) : null;
  if (b.customer && !customer) return res.status(400).json({ message: "Selected customer was not found." });

  const prepared = [];
  for (const item of b.items) {
    const qty = number(item.quantity, "Item quantity", 1);
    const product = await Product.findById(item.product);
    if (!product) return res.status(400).json({ message: "One of the selected products was not found." });
    if (product.quantity < qty) return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.quantity}.` });
    prepared.push({ product, qty, unitPrice: number(item.unitPrice ?? product.sellingPrice, "Unit price") });
  }
  const subtotal = prepared.reduce((sum, x) => sum + x.qty * x.unitPrice, 0);
  const discount = number(b.discount ?? 0, "Discount");
  if (discount > subtotal) return res.status(400).json({ message: "Discount cannot exceed subtotal." });
  const taxRate = number(b.taxRate ?? 0, "Tax rate");
  if (taxRate > 100) return res.status(400).json({ message: "Tax rate cannot exceed 100%." });
  const taxable = subtotal - discount;
  const taxAmount = Math.round(taxable * taxRate) / 100;
  const total = Math.round((taxable + taxAmount) * 100) / 100;
  const estimatedProfit = Math.round((prepared.reduce((sum, x) => sum + x.qty * (x.unitPrice - x.product.costPrice), 0) - discount) * 100) / 100;

  // Conditional stock update prevents two requests from selling the same last unit.
  for (const x of prepared) {
    const updated = await Product.findOneAndUpdate({ _id: x.product._id, quantity: { $gte: x.qty } }, { $inc: { quantity: -x.qty } }, { new: true });
    if (!updated) {
      // Restore any earlier decrements if a concurrent sale consumed stock.
      for (const done of prepared.slice(0, prepared.indexOf(x))) await Product.updateOne({ _id: done.product._id }, { $inc: { quantity: done.qty } });
      return res.status(409).json({ message: `Stock changed while processing ${x.product.name}. Refresh and try again.` });
    }
  }
  try {
    const sale = await Sale.create({
      invoiceNumber: makeNumber("INV"), customer: customer?._id || null, customerName: customer?.name || "Walk-in customer",
      items: prepared.map(x => ({ product: x.product._id, name: x.product.name, sku: x.product.sku, quantity: x.qty, unitPrice: x.unitPrice, unitCost: x.product.costPrice, lineTotal: x.qty * x.unitPrice })),
      subtotal, discount, taxRate, taxAmount, total, estimatedProfit,
      paymentMethod: b.paymentMethod || "Cash", notes: String(b.notes || "")
    });
    res.status(201).json(sale);
  } catch (e) {
    for (const x of prepared) await Product.updateOne({ _id: x.product._id }, { $inc: { quantity: x.qty } });
    throw e;
  }
}));

app.get("/api/purchases", asyncRoute(async (_req, res) => res.json(await Purchase.find().sort({ createdAt: -1 }).limit(300))));
app.post("/api/purchases", asyncRoute(async (req, res) => {
  const b = req.body;
  if (!Array.isArray(b.items) || b.items.length === 0) return res.status(400).json({ message: "Add at least one item to the purchase." });
  const supplier = b.supplier ? await Supplier.findById(b.supplier) : null;
  if (b.supplier && !supplier) return res.status(400).json({ message: "Selected supplier was not found." });
  const prepared = [];
  for (const item of b.items) {
    const qty = number(item.quantity, "Item quantity", 1);
    const cost = number(item.unitPrice, "Unit cost");
    let product = await Product.findById(item.product);
    if (!product) return res.status(400).json({ message: "One of the selected products was not found." });
    prepared.push({ product, qty, cost });
  }
  const subtotal = prepared.reduce((sum, x) => sum + x.qty * x.cost, 0);
  for (const x of prepared) {
    await Product.updateOne({ _id: x.product._id }, { $inc: { quantity: x.qty }, $set: { costPrice: x.cost } });
  }
  try {
    const purchase = await Purchase.create({
      purchaseNumber: makeNumber("PUR"), supplier: supplier?._id || null, supplierName: supplier?.name || "Unspecified supplier",
      items: prepared.map(x => ({ product: x.product._id, name: x.product.name, sku: x.product.sku, quantity: x.qty, unitPrice: x.cost, unitCost: x.cost, lineTotal: x.qty * x.cost })),
      subtotal, total: subtotal, notes: String(b.notes || "")
    });
    res.status(201).json(purchase);
  } catch (e) {
    for (const x of prepared) await Product.updateOne({ _id: x.product._id }, { $inc: { quantity: -x.qty } });
    throw e;
  }
}));

app.get("/api/dashboard", asyncRoute(async (_req, res) => {
  const [products, sales, purchases, lowStock, recentSales] = await Promise.all([
    Product.find(), Sale.find(), Purchase.find(), Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).sort({ quantity: 1 }).limit(8),
    Sale.find().sort({ createdAt: -1 }).limit(5)
  ]);
  const totalSales = sales.reduce((s, x) => s + x.total, 0);
  const totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
  const estimatedProfit = sales.reduce((s, x) => s + x.estimatedProfit, 0);
  const inventoryValue = products.reduce((s, x) => s + x.quantity * x.costPrice, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthSales = sales.filter(x => x.createdAt >= monthStart).reduce((s, x) => s + x.total, 0);
  res.json({
    stats: { productCount: products.length, customerCount: await Customer.countDocuments(), supplierCount: await Supplier.countDocuments(),
      totalSales, totalPurchases, estimatedProfit, inventoryValue, lowStockCount: lowStock.length, monthSales },
    lowStock, recentSales
  });
}));

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "That value already exists. Please use a unique SKU or email." });
  if (err.name === "ValidationError") return res.status(400).json({ message: Object.values(err.errors).map(x => x.message).join(" ") });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid record ID." });
  res.status(err.status || 500).json({ message: err.message || "Unexpected server error." });
});

const port = Number(process.env.PORT || 5000);
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_billing")
  .then(() => app.listen(port, () => console.log(`API ready at http://localhost:${port}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
