import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "*.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
      },
      {
        protocol: "https",
        hostname: "*.goodreads.com",
      },
    ],
  },
};

export default nextConfig;
