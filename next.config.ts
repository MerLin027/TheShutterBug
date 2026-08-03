import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — used for all uploaded portfolio photos
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Google AI / Stitch design-reference images used on the home hero
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
