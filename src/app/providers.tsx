"use client";

import { Provider } from "jotai";
import { MapProvider } from "react-map-gl/maplibre";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <Provider>{children}</Provider>
    </MapProvider>
  );
}
