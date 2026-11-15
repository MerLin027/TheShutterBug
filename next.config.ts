import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No experimental viewTransition any more: it froze the page during route
  // changes, which swallowed clicks made mid-transition (measured: four quick
  // "Next" presses moved one photo). The gallery now opens photos in an
  // in-page viewer instead (REDESIGN.md, Phase R).
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
