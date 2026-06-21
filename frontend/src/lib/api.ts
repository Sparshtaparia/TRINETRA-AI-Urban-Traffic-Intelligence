// Backend URL: proxy requests through Next.js rewrite in production to avoid DNS/CORS issues
// Local dev: falls back to localhost:8000
export const API_BASE: string = process.env.NODE_ENV === "production" 
  ? "" 
  : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
