// Backend URL: set NEXT_PUBLIC_API_BASE_URL in Vercel Dashboard to your Railway URL
// e.g. https://trinetra-backend.up.railway.app
// Local dev: falls back to localhost:8000
export const API_BASE: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
