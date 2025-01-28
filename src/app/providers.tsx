"use client";

import { MapProvider } from "@vis.gl/react-maplibre";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
      <MapProvider>{children}</MapProvider>
  );
}
