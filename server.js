require("dotenv").config();
"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const {
  SecretsManagerClient,
  GetSecretValueCommand
} = require("@aws-sdk/client-secrets-manager");

const PORT = Number(process.env.PORT || 3000);
const AWS_REGION = process.env.AWS_REGION || "eu-central-1";
const SECRET_NAME = process.env.SECRET_NAME;

if (!SECRET_NAME) {
  console.error("Missing SECRET_NAME env var.");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let pool;

async function getDbConfig() {
  const client = new SecretsManagerClient({ region: AWS_REGION });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_NAME })
  );

  if (!response.SecretString) {
    throw new Error("SecretString is empty");
  }

  const secret = JSON.parse(response.SecretString);

  return {
    host: secret.host,
    port: secret.port || 3306,
    user: secret.username,
    password: secret.password,
    database: secret.dbname,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

async function initDb() {
  const config = await getDbConfig();
  pool = mysql.createPool(config);
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
