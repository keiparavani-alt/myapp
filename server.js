require('dotenv').config();
"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const PORT = Number(process.env.PORT || 3000);

// These MUST be set on the EC2 instance as environment variables:
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error("Missing DB env vars. Set DB_HOST, DB_USER, DB_PASS, DB_NAME.");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static("public"));

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  // quick test
  await pool.query("SELECT 1");
}

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    // Basic validation
    if (!name || name.length > 100) return res.status(400).send("Invalid name");
    if (!email || email.length > 255 || !email.includes("@")) return res.status(400).send("Invalid email");
    if (!password || password.length < 6 || password.length > 128) return res.status(400).send("Invalid password");

    const password_hash = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, password_hash]
    );

    res.status(200).send("User registered");
  } catch (err) {
    // MySQL duplicate email
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).send("Email already exists");
    }
    console.error(err);
    res.status(500).send("Server error");
  }
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));
  })
  .catch((e) => {
    console.error("DB init failed:", e.message);
    process.exit(1);
  });
