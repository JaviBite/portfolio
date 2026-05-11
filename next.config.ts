import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Remove 'output: export' if you want the /api/chat chatbot to work on Vercel.
  // Vercel supports hybrid: static pages + serverless API routes without this flag.
  // Keep 'export' only if you're deploying to a pure static host (GitHub Pages, etc.)
  // and handle the chat API separately.
  //
  // For Vercel deployment (recommended): comment out the line below.
  // output: "export",

  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
