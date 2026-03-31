import crypto from "crypto";

import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const AWS_STORAGE_BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME;
const AWS_S3_CUSTOM_DOMAIN = process.env.AWS_S3_CUSTOM_DOMAIN;

const BUILD_ID = crypto.randomUUID();

/** @type {import("next").NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: true,
  generateBuildId: () => BUILD_ID,
  env: {
    BUILD_ID: BUILD_ID,
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    serverSourceMaps: true,
    serverActions: {
      bodySizeLimit: "3mb", // match GIF size limit on the server
    },
  },
  turbopack: {
    rules: {
      "*.svg": [
        {
          condition: { query: /\burl\b/ },
          type: "asset",
        },
        {
          condition: { not: { query: /\burl\b/ } },
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.metaculus.com",
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
      ...(AWS_S3_CUSTOM_DOMAIN
        ? [
            {
              protocol: "https",
              hostname: AWS_S3_CUSTOM_DOMAIN,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  async redirects() {
    return [
      {
        source: "/project/:slug",
        destination: "/tournament/:slug",
        permanent: true,
      },
      {
        source: "/bridgewater-reg",
        destination: "/bridgewater",
        permanent: true,
      },
      {
        source: "/aib",
        destination: "/futureeval",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/index/:slug",
        destination: "/tournament/:slug",
      },
      {
        source: "/files/forecasting-owid-report.pdf",
        destination:
          "https://metaculus-public.s3.us-west-2.amazonaws.com/OWID%2Breport.pdf",
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "metaculus",
  project: "metaculus-frontend",
  silent: false,
  telemetry: false,
  sourcemaps: {
    disable: true,
  },
});
