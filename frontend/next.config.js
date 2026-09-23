/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The backend URL is read at runtime via NEXT_PUBLIC_BACKEND_URL, never
  // hardcoded, and no API keys live in frontend code — the browser only
  // ever talks to our own backend, never directly to the LLM.
};

module.exports = nextConfig;
