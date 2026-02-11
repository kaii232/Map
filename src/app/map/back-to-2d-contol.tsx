"use client";

import { Button } from "@/components/ui/button";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/maplibre";

const BackTo2D = () => {
  const { map } = useMap();
  const [controlContainer, setControlContainer] = useState<Element | null>(
    null,
  );

  useEffect(() => {
    if (!map) return;

    const element = document.querySelector(".maplibregl-ctrl-top-right");
    if (element) setControlContainer(element);
  }, [map]);

  if (!controlContainer) return null;

  return createPortal(
    <div className="maplibregl-ctrl maplibregl-ctrl-group">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back to 2D"
        title="Back to 2D"
        className="text-neutral-700 disabled:pointer-events-none disabled:opacity-60"
        style={{ padding: "2.5px" }}
        onClick={() => {
          if (!map) return;

          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 600,
          });

          if ("getTerrain" in map && typeof map.getTerrain === "function") {
            const terrain = map.getTerrain();
            if (
              terrain &&
              "setTerrain" in map &&
              typeof map.setTerrain === "function"
            ) {
              map.setTerrain(null);
            }
          }
        }}
      >
        <span className="text-xs font-semibold leading-none">2D</span>
      </Button>
    </div>,
    controlContainer,
  );
};

export default memo(BackTo2D);
