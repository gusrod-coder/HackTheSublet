import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Teammates hit the dev server over the tailnet (http://<host>:3000).
  // "*.ts.net" alone doesn't match <machine>.<tailnet>.ts.net (the Funnel address), hence "*.*.ts.net".
  allowedDevOrigins: ["*.ts.net", "*.*.ts.net", "100.*.*.*"],
};

export default nextConfig;
