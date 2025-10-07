// test-connection.js
require("dotenv").config();
const { Client } = require("pg");

async function testConnection() {
  // Ganti dengan DIRECT_URL jika itu yang Anda gunakan
  const connectionString = process.env.DIRECT_URL;

  if (!connectionString) {
    console.error("❌ DIRECT_URL tidak ditemukan di file .env");
    return;
  }

  console.log("🔄 Mencoba terhubung ke database...");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✅ Koneksi ke database Supabase BERHASIL!");
  } catch (error) {
    console.error("❌ GAGAL terhubung ke database!");
    console.error("Detail Error:", error.message);
  } finally {
    await client.end();
  }
}

testConnection();
