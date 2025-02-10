"use client";

import { MapProvider } from "@vis.gl/react-maplibre";
import { Provider } from "jotai";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <Provider>{children}</Provider>
    </MapProvider>
  );
}
