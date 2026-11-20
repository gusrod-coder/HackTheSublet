import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Teammates hit the dev server over the tailnet (http://<host>:3000).
  allowedDevOrigins: ["*.ts.net", "100.*.*.*"],
};

export default nextConfig;
