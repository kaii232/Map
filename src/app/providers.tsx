"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "jotai";
import { MapProvider } from "react-map-gl/maplibre";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <TooltipProvider delayDuration={300}>
        <Provider>{children}</Provider>
      </TooltipProvider>
    </MapProvider>
  );
}
