"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

export default function MapScale() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const scale = new maplibregl.ScaleControl({
      maxWidth: 120,
      unit: "metric",
    });

    map.addControl(scale, "bottom-right");

    return () => {
      map.removeControl(scale);
    };
  }, [map]);

  return null;
}
