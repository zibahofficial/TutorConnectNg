import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandboxed/proxied preview domain (and any e2b.app preview
  // subdomain) to talk to the Next.js dev server's HMR/asset endpoints.
  // Without this, the dev server silently blocks cross-origin requests and
  // the page never finishes hydrating, which makes every button look dead.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
