import { config } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

// Load root .env so user edits to C:\Users\spars\Desktop\FK\.env take effect
config({ path: resolve(process.cwd(), "..", ".env") });

const nextConfig: NextConfig = {};

export default nextConfig;
