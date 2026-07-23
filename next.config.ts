import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the server free of any accidental client bundling of secrets:
  // never add GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY to `env` here.
};

export default nextConfig;
