import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";


/** @type {import("next").NextConfig} */
const nextConfig = {
  env: {
    API_BASE_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "metaculus-media.s3.amazonaws.com",
        pathname: "/**",
      },
      // TODO: move this to ENV
      {
        protocol: "https",
        hostname: "dev-rewrite-metaculus-media.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3s0w6fek99l5b.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  rewrites: () => ([
    // Django Admin rewrites
    {
      source: "/admin/:path*",
      destination: `${API_BASE_URL}/admin/:path*/`,
    },
    // Assets
    {
      source: "/static/admin/:path*",
      destination: `${API_BASE_URL}/static/admin/:path*`,
    },
  ]),
};

export default withNextIntl(nextConfig);
