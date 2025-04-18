import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

const AWS_STORAGE_BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME;

/** @type {import("next").NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: true,
  env: {
    // Do not add anything here. Buildtime environment variables are deprecated
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    serverSourceMaps: true,
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
        hostname: "metaculus-web-media.s3.amazonaws.com",
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
  async rewrites() {
    return [
      {
        source: "/index/:slug",
        destination: "/tournament/:slug",
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { buildId }) => {
    config.output.filename = config.output.filename.replace(
      "[chunkhash]",
      buildId
    );

    return config;
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
