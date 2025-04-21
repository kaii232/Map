"use client";

import Spinner from "@/components/ui/spinner";
import { ALL_FILTERS } from "@/lib/filters";
import { velocityStops } from "@/lib/utils";
import { downloadZip } from "client-zip";
import { useAtomValue } from "jotai";
import { Download } from "lucide-react";
import maplibregl from "maplibre-gl";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/maplibre";
import { toast } from "sonner";
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
      name: index === 0 ? "Combined_map.png" : `Layer_${index}.png`,
      input: image,
    })),
  ).blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "map_layers.zip";
  link.click();
  link.remove();
};

const prepareNextLayer = (
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
  toast(`Processing layer ${activeLayer + 1} of ${layersToExport.length}`, {
    id: "download-map",
  });
};

const DownloadControl = () => {
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
    toast("Downloading map layers...", {
      icon: <Spinner className="size-5" />,
      duration: Infinity,
      id: `download-map`,
    });
    const hidden = document.createElement("div");
    hidden.className = "sr-only";
    document.body.appendChild(hidden);
    const container = document.createElement("div");
    // Make the canvas a square
    container.style.height = window.innerHeight + "px";
    container.style.width = window.innerWidth + "px";
    hidden.appendChild(container);
    const newMap = new maplibregl.Map({
      container: container,
      style: map.getStyle(),
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      interactive: false,
      maxCanvasSize: [8192, 8192],
      pixelRatio: 8192 / window.innerWidth, // Always make the width max resolution
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
      fadeDuration: 0,
      attributionControl: false,
    });
    const images: Blob[] = [];
    const layersToExport: (string | string[])[] = [];
    const isTerrainEnabled = !!map.getTerrain();
    let iteration = -1;

    const cleanup = async () => {
      await downladFiles(images);
      // Cleanup
      setIsDrawing(false);
      container.remove();
      hidden.remove();
      newMap.remove();
    };
    newMap.once("load", () => {
      newMap.setPadding(map.getPadding());
    });

    newMap.on("idle", async () => {
      console.log("Map is idle", iteration);
      // Converts the map to an image
      // Iteration -1: Combined map
      // Iteration 1: Basemap only
      // Iteration 2+: Individual layers
      await new Promise((resolve) =>
        newMap.getCanvas().toBlob((blob) => {
          if (blob) images.push(blob);
          resolve(blob);
        }),
      );
      if (iteration >= layersToExport.length) {
        toast.dismiss("download-map");
        toast.success("All map layers processed!");
        await cleanup();
        return;
      }
      if (iteration === -1) {
        // Hide everything but the basemap
        Object.entries(dataVisibility).map(([src, visible]) => {
          if (visible && data[src as keyof typeof ALL_FILTERS]) {
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
        console.log(layersToExport);
        // If layersToExport is empty, no layers are hidden, idle function will not be called again
        if (layersToExport.length === 0) {
          await cleanup();
          return;
        }
      }
      if (iteration === 0) {
        // Set all layers to be invisible, this hides the basemap
        const allLayers = map.getStyle().layers;
        for (let i = 0; i < allLayers.length; i++) {
          newMap.setLayoutProperty(allLayers[i].id, "visibility", "none");
        }
        // Need to remove terrain from map if any otherwise the idle event will not be fired
        newMap.setTerrain(null);
      }
      // Hides the previous layer and shows the current layer
      if (iteration >= 0) prepareNextLayer(newMap, layersToExport, iteration);
      iteration += 1;
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
};
export default memo(DownloadControl);
