"use client";

import NorthArrow from "@/assets/map_north.png";
import { TourStep } from "@/components/tour";
import Spinner from "@/components/ui/spinner";
import { downloadData, velocityStops } from "@/lib/utils";
import { downloadZip } from "client-zip";
import { ExtractAtomValue, useAtomValue, useSetAtom } from "jotai";
import { Download } from "lucide-react";
import maplibregl from "maplibre-gl";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapRef, useMap } from "react-map-gl/maplibre";
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
const downladFiles = async (images: { name: string; blob: Blob | null }[]) => {
  const blob = await downloadZip(
    images
      .filter((image) => !!image.blob)
      .map((image) => ({
        name: image.name + ".png",
        input: image.blob!,
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

// Functions taken from:
// https://github.com/maplibre/maplibre-gl-js/blob/b3e282bbb0b8f93b503895281ec313a4e2a1c6be/src/ui/control/scale_control.ts#L48
function getDecimalRoundNum(d: number) {
  const multiplier = Math.pow(10, Math.ceil(-Math.log(d) / Math.LN10));
  return Math.round(d * multiplier) / multiplier;
}

function getRoundNum(num: number) {
  const pow10 = Math.pow(10, `${Math.floor(num)}`.length - 1);
  let d = num / pow10;

  d =
    d >= 10
      ? 10
      : d >= 5
        ? 5
        : d >= 3
          ? 3
          : d >= 2
            ? 2
            : d >= 1
              ? 1
              : getDecimalRoundNum(d);

  return pow10 * d;
}

const getMapScale = (map: maplibregl.Map | MapRef, width: number = 128) => {
  const y = map._containerDimensions()[1] / 2;
  const x = map._containerDimensions()[0] / 2;
  const left = map.unproject([x - width / 2, y]);
  const right = map.unproject([x + width / 2, y]);
  const globeWidth = Math.round(map.project(right).x - map.project(left).x);
  const maxWidth = Math.min(width, globeWidth, map._containerDimensions()[0]);
  const maxMeters = left.distanceTo(right);
  const maxDistance = maxMeters >= 1000 ? maxMeters / 1000 : maxMeters;
  const unit = maxMeters >= 1000 ? "km" : "m";

  const distance = getRoundNum(maxDistance);
  const ratio = distance / maxDistance;
  return {
    width:
      ratio *
      maxWidth *
      (map.getCanvas().width / map._containerDimensions()[0]), // Scale the width based on the pixel ratio
    label: `${distance} ${unit}`,
  };
};

const SCALE_OUTER_PADDING = 16;
const SCALE_BORDER_WIDTH = 4;
const SCALE_HEIGHT = 80;

const drawMapLabels = async (map: maplibregl.Map | MapRef) => {
  const mapLabels = document.createElement("canvas");
  mapLabels.width = map.getCanvas().width;
  mapLabels.height = map.getCanvas().height;
  const ctx = mapLabels.getContext("2d");
  if (!ctx) return;
  const mapScaleInfo = getMapScale(map);
  ctx.font = "24px/32px Arial";
  // Draw a rectangle with some padding
  ctx.fillStyle = "#FFFFFF80";
  ctx.fillRect(
    64,
    mapLabels.height - 64 - SCALE_HEIGHT,
    mapScaleInfo.width + SCALE_OUTER_PADDING * 2,
    SCALE_HEIGHT,
  );
  // Draw a black rectangle within the previous rectangle
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    64 + SCALE_OUTER_PADDING,
    mapLabels.height - 64 - SCALE_HEIGHT + SCALE_OUTER_PADDING,
    mapScaleInfo.width,
    SCALE_HEIGHT - 2 * SCALE_OUTER_PADDING,
  );
  ctx.fillStyle = "#FFFFFF80";
  // Clear a rectangle to leave a shape like |______| in black
  ctx.clearRect(
    64 + SCALE_OUTER_PADDING + SCALE_BORDER_WIDTH,
    mapLabels.height - 64 - SCALE_HEIGHT + SCALE_OUTER_PADDING,
    mapScaleInfo.width - SCALE_BORDER_WIDTH * 2,
    SCALE_HEIGHT - 2 * SCALE_OUTER_PADDING - SCALE_BORDER_WIDTH,
  );
  // Fill in the pixels we just cleared
  ctx.fillRect(
    64 + SCALE_OUTER_PADDING + SCALE_BORDER_WIDTH,
    mapLabels.height - 64 - SCALE_HEIGHT + SCALE_OUTER_PADDING,
    mapScaleInfo.width - SCALE_BORDER_WIDTH * 2,
    SCALE_HEIGHT - 2 * SCALE_OUTER_PADDING - SCALE_BORDER_WIDTH,
  );
  // Add in the text for the scale
  ctx.fillStyle = "#000000";
  ctx.fillText(
    mapScaleInfo.label,
    64 + SCALE_OUTER_PADDING + SCALE_BORDER_WIDTH + SCALE_OUTER_PADDING,
    mapLabels.height - 64 - SCALE_HEIGHT / 2 + 32 / 4, // 32 here is the line height of the text
  );
  const northArrow = new Image();
  await new Promise((resolve) => {
    northArrow.onload = () => {
      ctx.translate(
        mapLabels.width - 64 - northArrow.width / 2,
        mapLabels.height - 64 - northArrow.height / 2,
      );
      ctx.rotate((map.getBearing() * -Math.PI) / 180); // If you add in stuff to this canvas after this they will be rotated, rotate back if you need to add more things
      ctx.translate(
        -(mapLabels.width - 64 - northArrow.width / 2),
        -(mapLabels.height - 64 - northArrow.height / 2),
      );
      ctx.drawImage(
        northArrow,
        mapLabels.width - 64 - northArrow.width,
        mapLabels.height - 64 - northArrow.height,
      );
      resolve(true);
    };
    northArrow.src = NorthArrow.src;
  });
  return mapLabels;
};

/** Combined the labels with the map. Since the label canvas and the maplibre canvas has different canvas contexts (webgl vs 2d), need to convert maplibre canvas to image first then combine */
const combineCanvases = async (
  map: maplibregl.Map | MapRef,
  labels: HTMLCanvasElement,
): Promise<Blob | null> => {
  const mapImage = new Image();
  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = map.getCanvas().width;
  combinedCanvas.height = map.getCanvas().height;
  const ctx = combinedCanvas.getContext("2d");
  if (!ctx) return null;
  return new Promise((resolve) => {
    mapImage.onload = () => {
      ctx.drawImage(mapImage, 0, 0);
      ctx.drawImage(labels, 0, 0);
      combinedCanvas.toBlob((blob) => {
        combinedCanvas.remove();
        resolve(blob);
      });
    };
    mapImage.src = map.getCanvas().toDataURL();
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

  const drawLayers = async () => {
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
    const imagePromises: Promise<{ name: string; blob: Blob | null }>[] = [];
    const layersToExport: (string | string[])[] = [];
    const isTerrainEnabled = !!map.getTerrain();
    let iteration = -1;

    // Draw north arrow and labels
    const labelCanvas = await drawMapLabels(newMap);
    if (!labelCanvas) return;
    imagePromises.push(
      new Promise((resolve) =>
        // Converts the map to an image
        labelCanvas.toBlob((blob) => {
          resolve({ name: "labels", blob });
        }),
      ),
    );

    const cleanup = async () => {
      const images = await Promise.all(imagePromises);
      toast.dismiss("download-map");
      toast.success("All map layers processed!");
      await downladFiles(images);
      // Cleanup
      setIsDrawing(false);
      container.remove();
      hidden.remove();
      newMap.remove();
      labelCanvas.remove();
    };

    newMap.on("idle", async () => {
      // Iteration -1: Combined map
      // Iteration 1: Basemap only
      // Iteration 2+: Individual layers
      // Converts the map to an image
      imagePromises.push(
        new Promise((resolve) => {
          const currentIter = iteration;
          newMap.getCanvas().toBlob((blob) => {
            resolve({
              name:
                currentIter === -1
                  ? "combined_map_no_labels"
                  : currentIter === 0
                    ? "basemap"
                    : `layer_${currentIter}`,
              blob,
            });
          });
        }),
      );

      if (iteration >= layersToExport.length) {
        await cleanup();
        return;
      }
      if (iteration === -1) {
        // Combine the labels with the combined map
        imagePromises.push(
          combineCanvases(newMap, labelCanvas).then((blob) => ({
            name: "combined_map",
            blob,
          })),
        );
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
