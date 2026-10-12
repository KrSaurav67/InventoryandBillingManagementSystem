// StockPilot demo-data seeder (Node.js 18+)
// Creates DEMO-prefixed records through your own API. It does not delete records.
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

const API_BASE = "http://localhost:5000/api";
const rl = readline.createInterface({ input, output });

async function ask(q) { return (await rl.question(q)).trim(); }

async function request(path, method = "GET", body, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${data.message || raw || "Unknown error"}`);
  }
  return data;
}

async function main() {
  console.log("\\n=== StockPilot Inventory & Billing Demo Data ===");
  console.log("Creates a demo customer, supplier, 4 products, 1 purchase, and 1 sale.");
  console.log("It does not delete or overwrite existing records.\\n");

  const email = await ask("Registered login email: ");
  const password = await ask("Login password (visible while typing): ");
  if (!email || !password) throw new Error("Email and password are required.");

  const login = await request("/auth/login", "POST", { email, password });
  if (!login.token) throw new Error("Login did not return a token.");
  const token = login.token;
  const tag = `DEMO-${Date.now().toString().slice(-7)}`;

  console.log("\\nLogin successful. Adding sample data...");
  const customer = await request("/customers", "POST", {
    name: `${tag} Customer`,
    email: `customer.${tag.toLowerCase()}@example.com`,
    phone: "9000000001",
    address: "Demo Market, Bhopal, Madhya Pradesh",
  }, token);
  console.log("✓ Customer:", customer.name);

  const supplier = await request("/suppliers", "POST", {
    name: `${tag} Supplier`,
    email: `supplier.${tag.toLowerCase()}@example.com`,
    phone: "9000000002",
    address: "Demo Industrial Area, Bhopal, Madhya Pradesh",
  }, token);
  console.log("✓ Supplier:", supplier.name);

  const specs = [
    { suffix: "NOTEBOOK", name: `${tag} Notebook`, category: "Stationery", costPrice: 30, sellingPrice: 50, quantity: 12, reorderLevel: 5 },
    { suffix: "PEN", name: `${tag} Pen Pack`, category: "Stationery", costPrice: 20, sellingPrice: 35, quantity: 3, reorderLevel: 5 },
    { suffix: "MOUSE", name: `${tag} Wireless Mouse`, category: "Electronics", costPrice: 250, sellingPrice: 399, quantity: 10, reorderLevel: 4 },
    { suffix: "BOTTLE", name: `${tag} Water Bottle`, category: "Accessories", costPrice: 100, sellingPrice: 160, quantity: 8, reorderLevel: 3 },
  ];

  const products = [];
  for (const p of specs) {
    const item = await request("/products", "POST", {
      name: p.name,
      sku: `${tag}-${p.suffix}`,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
    }, token);
    products.push(item);
    console.log(`✓ Product: ${item.name} (opening stock ${item.quantity})`);
  }

  const purchase = await request("/purchases", "POST", {
    supplier: supplier._id,
    items: [{ product: products[0]._id, quantity: 5, unitPrice: products[0].costPrice }],
    notes: `${tag} test purchase`,
  }, token);
  console.log("✓ Purchase:", purchase.purchaseNumber || "recorded");

  const sale = await request("/sales", "POST", {
    customer: customer._id,
    items: [
      { product: products[0]._id, quantity: 2, unitPrice: products[0].sellingPrice },
      { product: products[2]._id, quantity: 1, unitPrice: products[2].sellingPrice },
    ],
    discount: 10,
    taxRate: 5,
    paymentMethod: "UPI",
    notes: `${tag} test sale`,
  }, token);
  console.log("✓ Sale/invoice:", sale.invoiceNumber || "recorded");

  console.log("\\nDONE. Refresh the app and test Dashboard, Products, Customers, Suppliers, Purchases, and Sales & Billing.");
  console.log("Search for the prefix:", tag);
  console.log("Check that the Pen Pack appears in low-stock alerts.");
  console.log("Allow browser pop-ups to test invoice printing.");
  console.log("\\nThese records persist in the configured database. Delete demo records manually when finished.");
}

main()
  .catch((err) => {
    console.error("\\n✗ Demo data setup stopped:", err.message);
    console.error("Check backend http://localhost:5000, database connectivity, and your login.");
    process.exitCode = 1;
  })
  .finally(() => rl.close());
