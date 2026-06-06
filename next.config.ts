import type { NextConfig } from "next";

/** Must exceed multipart photo uploads — see MAX_AVATAR_BYTES in streak constants */
const UPLOAD_BODY_LIMIT = "12mb";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: UPLOAD_BODY_LIMIT,
    },
    proxyClientMaxBodySize: UPLOAD_BODY_LIMIT,
  },
};

export default nextConfig;
