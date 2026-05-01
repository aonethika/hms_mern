import pkg from "pg";
const { Pool } = pkg;

export const createPool = () => {
  return new Pool({
    user: String(process.env.DB_USER || "").trim(),
    host: String(process.env.DB_HOST || "").trim(),
    database: String(process.env.DB_NAME || "").trim(),
    password: String(process.env.DB_PASSWORD || "").trim(),
    port: Number(process.env.DB_PORT || 5432),
    ssl: { rejectUnauthorized: false },
  });
};