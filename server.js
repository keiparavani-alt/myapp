require("dotenv").config();
"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const PORT = Number(process.env.PORT || 3000);

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
app.use(express.urlencoded({ extended: true }));

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

  await pool.query("SELECT 1");
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("db error");
  }
});

app.post("/submit", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    res.send("Saved");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();
