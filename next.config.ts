import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deixa o celular na mesma rede Wi-Fi usar o servidor de desenvolvimento (npm run dev).
  // Só vale para o dev; não afeta o site publicado.
  allowedDevOrigins: ["192.168.1.133"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
