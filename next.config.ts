import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> integration: route navigations run as view
    // transitions, so a photograph tagged with a shared name morphs from its
    // grid card into the lightbox (REDESIGN.md task B10). Browsers without
    // the View Transitions API simply navigate without the animation.
    viewTransition: true,
  },
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
