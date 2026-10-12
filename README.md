# Inventory & Billing Management System

A full-stack inventory and billing application built with React, Vite, Node.js, Express, and MongoDB.

## Features
- JWT authentication and hashed passwords
- Dashboard: sales, purchases, estimated gross profit, inventory value, low-stock alerts
- Product CRUD with SKU, category, cost price, selling price, quantity, and reorder level
- Customer and supplier management
- Purchase recording (increases stock)
- Sales/invoices (decreases stock and prevents overselling)
- Search/filter tables and printable invoices
- Responsive layout

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- MongoDB Community Server running locally OR a MongoDB Atlas connection string

## 1. Configure the backend
Open a terminal in the `server` folder:
```bash
npm install
```
Copy `.env.example` to `.env`, then update `MONGO_URI` and `JWT_SECRET`.
On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```
On macOS/Linux:
```bash
cp .env.example .env
```

Start the API:
```bash
npm run dev
```
The API runs at http://localhost:5000.

## 2. Configure the frontend
Open a second terminal in the `client` folder:
```bash
npm install
npm run dev
```
Open the local URL Vite prints (usually http://localhost:5173).

## 3. Create your account
Use **Create account** on the login screen. The first account can be used as the administrator account for a local/demo setup. Keep the app on a trusted local network; this starter does not implement invitation-only account creation.

## 4. Use the app
1. Add products in Products.
2. Add customers and suppliers.
3. Record a purchase to increase stock.
4. Create a sale to generate an invoice and reduce stock.
5. View sales, purchases, inventory value, and low-stock alerts on Dashboard.

## Notes
- Currency defaults to INR (₹).
- Sales profit is an estimate based on the product cost price at the time the sale is recorded.
- This is a learning/demo project, not a certified GST/accounting package. Tax is configurable per sale but GST compliance, returns, payment gateway integration, and audit-grade accounting are not included.
- The frontend stores the JWT in localStorage for simplicity. For a production deployment, consider secure httpOnly cookies, rate limiting, stricter account provisioning, backups, and audit logging.
