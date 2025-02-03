import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Add custom Webpack loaders for .geojson, .csv, and .xlsx files
    config.module.rules.push(
      {
        test: /\.geojson$/,
        use: [
          {
            loader: "json-loader",
          },
        ],
      },
      {
        test: /\.csv$/,
        use: [
          {
            loader: "csv-loader",
            options: {
              dynamicTyping: true,
              header: true,
              skipEmptyLines: true,
            },
          },
        ],
      },
      {
        /* `test` matches file extensions */
        test: /\.(numbers|xls|xlsx|xlsb)$/,
        /* use the loader script */
        use: [{ loader: path.resolve("./sheetjs-loader.js") }],
      },
    );

    return config;
  },
};

export default nextConfig;
