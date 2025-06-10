"use client";

import { TourStep } from "@/components/tour";
import Spinner from "@/components/ui/spinner";
import { downloadData, velocityStops } from "@/lib/utils";
import { downloadZip } from "client-zip";
import { ExtractAtomValue, useAtomValue, useSetAtom } from "jotai";
import { Download } from "lucide-react";
import maplibregl from "maplibre-gl";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/maplibre";
import { toast } from "sonner";
import { layersAtom, panelOpenAtom } from "./atoms";

/** Layer IDs for each map layer for separating when downloading */
const SOURCES_LAYERS: Record<
  keyof ExtractAtomValue<typeof layersAtom>,
  string[]
> = {
  hillshade: ["terrainHillshade"],
  plateMovementVectors: velocityStops.map((_, index) => `velocity_${index}`),
  plates: ["plates", "platesBoundaries"],
  platesNew: ["platesNew", "platesNewBoundaries"],
  seafloorAge: ["seafloorAge"],
  crustThickness: ["crustThickness"],
};

/** Zips and downloads the files */
const downladFiles = async (images: Blob[]) => {
  const blob = await downloadZip(
    images.map((image, index) => ({
      name:
        index === 0
          ? "combined_map.png"
          : index === 1
            ? `basemap.png`
            : `layer_${index - 1}.png`,
      input: image,
    })),
  ).blob();
  downloadData(blob, "map_layers.zip");
};

/** Toggles the visibility of the previous and current layers */
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

/** Downloads the currently visible map in separate layers */
const DownloadControl = ({ layerIds }: { layerIds: (string | string[])[] }) => {
  const layers = useAtomValue(layersAtom);
  const [controlContainer, setControlContainer] = useState<Element | null>(
    null,
  );
  const { map } = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const setPanelOpen = useSetAtom(panelOpenAtom);

  const drawLayers = () => {
    if (!map) return;
    const mapDataLayers = layerIds;
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
    container.style.height = window.innerHeight + "px";
    container.style.width = window.innerWidth + "px";
    hidden.appendChild(container);
    const newMap = new maplibregl.Map({
      container: container,
      style: map.getStyle(),
      center: map.getCenter(),
      bearing: map.getBearing(),
      bounds: map.getBounds(),
      fitBoundsOptions: { padding: map.getPadding() },
      pitch: map.getPitch(),
      interactive: false,
      maxCanvasSize: [8192, 8192],
      pixelRatio: 8192 / window.innerWidth, // Always make the width max resolution
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
        antialias: true,
      },
      fadeDuration: 0,
      attributionControl: false,
    });
    const images: Blob[] = [];
    const layersToExport: (string | string[])[] = [];
    const isTerrainEnabled = !!map.getTerrain();
    let iteration = -1;

    const cleanup = async () => {
      toast.dismiss("download-map");
      toast.success("All map layers processed!");
      await downladFiles(images);
      // Cleanup
      setIsDrawing(false);
      container.remove();
      hidden.remove();
      newMap.remove();
    };

    newMap.on("idle", async () => {
      // Iteration -1: Combined map
      // Iteration 1: Basemap only
      // Iteration 2+: Individual layers
      await new Promise((resolve) =>
        // Converts the map to an image
        newMap.getCanvas().toBlob((blob) => {
          if (blob) images.push(blob);
          resolve(blob);
        }),
      );

      if (iteration >= layersToExport.length) {
        await cleanup();
        return;
      }
      if (iteration === -1) {
        // Hide everything but the basemap
        mapDataLayers.forEach((layer) => {
          if (Array.isArray(layer)) {
            const group: string[] = []; //Technically if one layer is visible all are visible so this could just be a boolean, but who knows
            layer.forEach((layerPart) => {
              if (newMap.getLayer(layerPart)?.visibility === "visible") {
                group.push(layerPart);
                newMap.setLayoutProperty(layerPart, "visibility", "none");
              }
            });
            if (group.length > 0) layersToExport.push(group);
            return;
          }

          if (newMap.getLayer(layer)?.visibility === "visible") {
            layersToExport.push(layer);
            newMap.setLayoutProperty(layer, "visibility", "none");
          }
        });

        // For additional data layers
        Object.entries(layers).map(([src, visible]) => {
          // If terrain is enabled do not disable hillshade as "idle" event will not be fired
          if (visible && (!isTerrainEnabled || src !== "hillshade")) {
            layersToExport.push(
              SOURCES_LAYERS[src as keyof ExtractAtomValue<typeof layersAtom>],
            );
            SOURCES_LAYERS[
              src as keyof ExtractAtomValue<typeof layersAtom>
            ].forEach((layerId) =>
              newMap.setLayoutProperty(layerId, "visibility", "none"),
            );
          }
        });
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
        // Need to remove terrain from map if any, otherwise the idle event will not be fired
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
    <TourStep
      step={7}
      localBeforeStep={() => setPanelOpen(false)}
      localGoBackStep={() => setPanelOpen(true)}
    >
      <div className="maplibregl-ctrl maplibregl-ctrl-group">
        <button
          onClick={drawLayers}
          className="text-neutral-700 disabled:pointer-events-none disabled:opacity-60"
          disabled={isDrawing}
          style={{ padding: "2.5px" }}
        >
          {isDrawing ? <Spinner className="size-6" /> : <Download />}
        </button>
      </div>
    </TourStep>,
    controlContainer,
  );
};
export default memo(DownloadControl);
