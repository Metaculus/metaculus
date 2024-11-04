import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const AWS_STORAGE_BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME;

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
      ...(AWS_STORAGE_BUCKET_NAME
        ? [
            {
              protocol: "https",
              hostname: `${AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com`,
              pathname: "/**",
            },
          ]
        : []),
      // TODO: move this to ENV
      {
        protocol: "https",
        hostname: "d3s0w6fek99l5b.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/project/:slug",
        destination: "/tournament/:slug",
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "metaculus",
  project: "metaculus-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  widenClientFileUpload: true,
});
