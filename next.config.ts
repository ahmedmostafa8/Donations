
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

export default withPWA({
  // Your Next.js config
  reactStrictMode: true,
  turbopack: {},
});

// Temporary fix: Export standard config to debug server actions
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   reactStrictMode: true,
// };

// export default nextConfig;
