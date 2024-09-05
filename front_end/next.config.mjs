import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** @type {import("next").NextConfig} */
const nextConfig = {
  trailingSlash: true,
  env: {
    API_BASE_URL,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "metaculus-media.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "metaculus-public.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
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
  rewrites: () => [
    // Django Admin rewrites
    {
      source: "/admin/:path*",
      destination: `${API_BASE_URL}/admin/:path*/`,
    },
    {
      source: "/api2/:path*/",
      destination: `${API_BASE_URL}/api2/:path*/`,
    },
    {
      source: "/api/:path*/",
      destination: `${API_BASE_URL}/api/:path*/`,
    },
    // Assets
    {
      source: "/static/admin/:path*",
      destination: `${API_BASE_URL}/static/admin/:path*`,
    },
    {
      source: "/static/debug_toolbar/:path*",
      destination: `${API_BASE_URL}/static/debug_toolbar/:path*`,
    },
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "metaculus",
  project: "metaculus-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
});
