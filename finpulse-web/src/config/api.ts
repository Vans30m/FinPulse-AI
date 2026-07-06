// src/config/api.ts
// Single source of truth for the backend URL across the entire frontend.
// In development  → http://localhost:3000
// In production   → whatever VITE_API_URL is set to in Vercel environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default API_BASE_URL;
