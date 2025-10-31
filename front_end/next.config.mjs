import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const AWS_STORAGE_BUCKET_NAME = process.env.AWS_STORAGE_BUCKET_NAME;
const GENERATE_SOURCE_MAPS = process.env.GENERATE_SOURCE_MAPS ?? true;

/** @type {import("next").NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: GENERATE_SOURCE_MAPS,
  env: {
    // Do not add anything here. Buildtime environment variables are deprecated
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "metaculus-media.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "metaculus-media.s3.us-west-2.amazonaws.com",
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
  webpack: (config, { buildId, webpack }) => {
    // propagate buildId to environment so we could trigger prompt message on outdated version
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(buildId),
      })
    );

    config.output.filename = config.output.filename.replace(
      "[chunkhash]",
      buildId
    );

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

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
