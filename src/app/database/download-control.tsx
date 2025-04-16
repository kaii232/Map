"use client";

import Spinner from "@/components/ui/spinner";
import { DataKeys } from "@/lib/types";
import { velocityStops } from "@/lib/utils";
import { downloadZip } from "client-zip";
import { useAtomValue } from "jotai";
import { Download } from "lucide-react";
import maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/maplibre";
import { dataAtom, dataVisibilityAtom, layersAtom } from "./atoms";

const SOURCES_LAYERS: Record<string, string[]> = {
  hillshade: ["terrainHillshade"],
  plateMovementVectors: velocityStops.map((_, index) => `velocity_${index}`),
  plates: ["plates", "platesBoundaries"],
  platesNew: ["platesNew", "platesNewBoundaries"],
  seafloorAge: ["seafloorAge"],
};

const downladFiles = async (images: Blob[]) => {
  const blob = await downloadZip(
    images.map((image, index) => ({
      name: `Layer_${index}.png`,
      input: image,
    })),
  ).blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "map_layers.zip";
  link.click();
  link.remove();
};

const renderNextLayer = (
  map: maplibregl.Map,
  layersToExport: (string | string[])[] = [],
  activeLayer: number,
) => {
  // Toggle visibility of previous layer
  if (activeLayer > 0) {
    const removeLayers = layersToExport[activeLayer - 1];
    if (Array.isArray(removeLayers)) {
      removeLayers.forEach((layer) =>
        map.setLayoutProperty(layer, "visibility", "none"),
      );
    } else {
      map.setLayoutProperty(removeLayers, "visibility", "none");
    }
  }
  // Toggle visibility of current layer
  const addLayers = layersToExport[activeLayer];
  if (Array.isArray(addLayers)) {
    addLayers.forEach((layer) =>
      map.setLayoutProperty(layer, "visibility", "visible"),
    );
  } else {
    map.setLayoutProperty(addLayers, "visibility", "visible");
  }
  console.log("layouts updated");
  return activeLayer + 1;
};

export default function DownloadControl() {
  const data = useAtomValue(dataAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);
  const layers = useAtomValue(layersAtom);
  const [controlContainer, setControlContainer] = useState<Element | null>(
    null,
  );
  const { map } = useMap();
  const [isDrawing, setIsDrawing] = useState(false);

  const drawLayers = () => {
    if (!map) return;
    setIsDrawing(true);
    const actualRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      get: function () {
        return 3;
      },
    });

    const hidden = document.createElement("div");
    hidden.className = "sr-only";
    document.body.appendChild(hidden);
    const container = document.createElement("div");
    container.style.height = window.innerHeight + "px";
    container.style.width = window.innerHeight + "px";
    hidden.appendChild(container);
    const newMap = new maplibregl.Map({
      container: container,
      style: { ...map.getStyle(), terrain: undefined },
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      interactive: false,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
      fadeDuration: 0,
      attributionControl: false,
    });
    const images: Blob[] = [];
    const layersToExport: (string | string[])[] = [];
    let isTerrainEnabled = false;
    let iteration = 0;
    newMap.on("load", () => {
      const terrain = map.getTerrain();
      if (terrain) {
        isTerrainEnabled = true;
        // Map will not fire "idle" event when terrain is enabled before hillshade for some reason
        newMap.setTerrain({
          source: terrain.source,
          exaggeration: 1.5,
        });
      }
      // For loaded data
      Object.entries(dataVisibility).map(([src, visible]) => {
        if (visible && data[src as DataKeys]) {
          if (src === "seis") {
            layersToExport.push([
              `${src}Mw`,
              `${src}Mb`,
              `${src}Ms`,
              `${src}None`,
            ]);
            newMap.setLayoutProperty(`${src}Mw`, "visibility", "none");
            newMap.setLayoutProperty(`${src}Mb`, "visibility", "none");
            newMap.setLayoutProperty(`${src}Ms`, "visibility", "none");
            newMap.setLayoutProperty(`${src}None`, "visibility", "none");
          } else {
            layersToExport.push(src);
            newMap.setLayoutProperty(src, "visibility", "none");
          }
        }
      });
      // For additional data layers
      Object.entries(layers).map(([src, visible]) => {
        // If terrain is enabled do not disable hillshade as "idle" event will not be fired
        if (visible && (!isTerrainEnabled || src !== "hillshade")) {
          layersToExport.push(SOURCES_LAYERS[src]);
          SOURCES_LAYERS[src].forEach((layerId) =>
            newMap.setLayoutProperty(layerId, "visibility", "none"),
          );
        }
      });
    });
    newMap.on("idle", async () => {
      console.log("Map is idle", iteration);
      await new Promise((resolve) =>
        newMap.getCanvas().toBlob((blob) => {
          if (blob) images.push(blob);
          resolve(blob);
        }),
      );
      if (iteration >= layersToExport.length) {
        await downladFiles(images);
        // Cleanup
        setIsDrawing(false);
        container.remove();
        hidden.remove();
        newMap.remove();
        Object.defineProperty(window, "devicePixelRatio", {
          get: function () {
            return actualRatio;
          },
        });
        return;
      }
      if (iteration === 0) {
        // Set all layers to be invisible, this hides the basemap
        const allLayers = map.getStyle().layers;
        for (let i = 0; i < allLayers.length; i++) {
          newMap.setLayoutProperty(allLayers[i].id, "visibility", "none");
        }
        newMap.setTerrain(null);
      }
      iteration = renderNextLayer(newMap, layersToExport, iteration);
    });
  };

  useEffect(() => {
    if (!map) return;

    const element = document.querySelector(".maplibregl-ctrl-top-right");
    if (element) setControlContainer(element);
  }, [map]);

  if (!controlContainer) return null;

  return createPortal(
    <div className="maplibregl-ctrl maplibregl-ctrl-group">
      <button
        onClick={drawLayers}
        className="text-neutral-700 disabled:pointer-events-none disabled:opacity-50"
        disabled={isDrawing}
        style={{ padding: "2.5px" }}
      >
        {isDrawing ? <Spinner className="size-6" /> : <Download />}
      </button>
    </div>,
    controlContainer,
  );
}
