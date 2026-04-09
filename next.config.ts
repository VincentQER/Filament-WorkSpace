import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module: only loaded when DATABASE_URL is unset (local SQLite).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
