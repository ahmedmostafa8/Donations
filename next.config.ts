
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

export default withPWA({
  // Your Next.js config
  reactStrictMode: true,
  turbopack: {},
});
