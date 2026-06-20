// On Vercel (any deployment - production OR preview), use a relative URL so the
// browser calls /_/backend on the SAME domain → zero CORS issues.
// In local dev, fall back to the env var or localhost.
const isVercel = typeof window !== "undefined"
  ? window.location.hostname.endsWith(".vercel.app")
  : !!process.env.VERCEL_ENV;

export const API_BASE: string = isVercel
  ? "/_/backend"
  : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
