import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure the prompts/ folder gets uploaded with the backend when we deploy.
  outputFileTracingIncludes: {
    "/api/**": ["./prompts/**"],
  },
};

export default nextConfig;
