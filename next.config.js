/** @type {import('next').NextConfig} */
const nextConfig = {
  // Consume @mta/ui-kit and @mta/api-client's TS source directly (they're
  // not published/pre-built for this vertical slice -- see README for the
  // `.deps/mta-ui-kit` local-checkout scheme).
  transpilePackages: ["@mta/ui-kit", "@mta/api-client"],
};

module.exports = nextConfig;
