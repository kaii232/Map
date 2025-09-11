"use client";

import { style } from "@/assets/map_style";
import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import type { ALL_FILTERS, PopulateFilters } from "@/lib/data-definitions";
import { Range } from "@/lib/filters";
import {
  camelCaseToWords,
  cn,
  formatUnits,
  getInterpolateRange,
  velocityStops,
} from "@/lib/utils";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { Position } from "geojson";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Layer,
  LayerProps,
  Map,
  MapEvent,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  TerrainControl,
  useMap,
} from "react-map-gl/maplibre";
import { GeoJSONStoreFeatures } from "terra-draw";
import triangle from "../../../public/triangle.png";
import {
  colorsAtom,
  dataAtom,
  dataVisibilityAtom,
  drawingAtom,
  rangeAtom,
  gnssIconsVisibleAtom,
  gnssVectorsVisibleAtom,
} from "./atoms";
import Basemaps from "./basemaps";
import Controls from "./controls";
import DownloadControl from "./download-control";
import DrawControl from "./draw-control";
import MapLayers, { MAP_LAYER_UNITS } from "./map-layers";
import RestartTour from "./restart-tour";

const drawOptionsModes: (
  | "polygon"
  | "rectangle"
  | "select"
  | "delete"
  | "circle"
  | "render"
  | "point"
  | "linestring"
  | "freehand"
  | "angled-rectangle"
  | "sensor"
  | "sector"
  | "delete-selection"
  | "download"
)[] = ["polygon", "rectangle", "select", "delete-selection", "delete"];

/** Convenience function to get the layer props for seismic data */
const getSeisProps = (
  property: "none" | "mb" | "mw" | "ms",
  range: Range | undefined,
  colors: string[],
): Exclude<LayerProps, { type: "custom" }> & { id: string } => ({
  id: property.charAt(0).toUpperCase() + property.substring(1),
  type: "circle",
  paint: {
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0, 8, 2],
    "circle-stroke-color": [
      "interpolate",
      ["exponential", 0.9],
      ["get", "depth"],
      ...getInterpolateRange(range ?? [2, 1024], ["#000000", "#f8fafc"]),
    ],
    "circle-opacity": 0.7,
    "circle-color": [
      "interpolate",
      ["linear"], // We do not set it to exponential here because it will interpolate exponentially between EACH stop instead of a smooth exponential curve through all stops
      ["get", "depth"],
      ...getInterpolateRange(range ?? [2, 1024], colors, 0.5), // This function will calculate the appropriate stops such that joining the points linearly approximates an exponential curve through the points
    ],
    "circle-radius":
      property !== "none"
        ? [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            ["interpolate", ["exponential", 2], ["get", property], 2, 3, 9, 12],
            15,
            ["interpolate", ["exponential", 2], ["get", property], 2, 8, 9, 32],
          ]
        : ["interpolate", ["linear"], ["zoom"], 5, 3, 12, 12],
  },
  filter:
    property !== "none"
      ? ["to-boolean", ["get", property]]
      : [
          "all",
          ["!", ["to-boolean", ["get", "mb"]]],
          ["!", ["to-boolean", ["get", "mw"]]],
          ["!", ["to-boolean", ["get", "ms"]]],
        ],
});

const commonMapLineStyles: Extract<LayerProps, { type: "line" }>["paint"] = {
  "line-width": [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    ["case", ["boolean", ["feature-state", "hover"], false], 6, 1],
    15,
    ["case", ["boolean", ["feature-state", "hover"], false], 16, 6],
  ],
  "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 1, 15, 0.6],
};

const commonMapCircleStyles: Extract<LayerProps, { type: "circle" }>["paint"] =
  {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 12, 12],
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0, 8, 2],
  };

/**
 * Convenience function to get the maps text and icon layer styles
 * @param get The property to get to display the text. Default of `"name"`
 * @param offset The text offset from the icon/other layer. Default of `1.2`
 * @param icon Name of the icon to use
 * @returns An object which can be spread directly into the layer style definition
 */
const mapSymbolStyle = (
  get: string = "name",
  offset: number = 1.2,
  icon?: string,
  paint?: Extract<LayerProps, { type: "symbol" }>["paint"],
  layout?: Extract<LayerProps, { type: "symbol" }>["layout"],
): Extract<LayerProps, { type: "symbol" }> => {
  return {
    type: "symbol",
    layout: {
      "text-field": ["get", get],
      "text-font": ["Noto Sans Regular"],
      "text-offset": [0, offset],
      "text-anchor": "top",
      "text-size": 12,
      "text-optional": true,
      ...(icon && {
        "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
        "icon-overlap": "always",
        "icon-image": icon,
      }),
      ...layout,
    },
    paint: {
      "text-halo-color": "#F8FAFCCC",
      "text-halo-width": 2,
      "text-opacity": {
        type: "interval",
        stops: [
          [7, 0],
          [8, 1],
        ],
      },
      ...paint,
    },
  };
};

/** Displays a row in the map popup. Note that the geometry property is used for downloading in .csv. It is omitted from displaying here. */
const PopupContent = memo(
  ({
    objKey,
    value,
    units,
  }: {
    objKey: string;
    value: string | number | null;
    units?: string;
  }) => {
    if (objKey === "geometry" || !value) return null;
    if (typeof value === "string" && value.includes("https://"))
      return (
        <div className="text-sm text-neutral-300">
          <span className="font-semibold">{camelCaseToWords(objKey)}:</span>{" "}
          <Link
            href={value}
            target="_blank"
            className="text-blue-400 hover:underline"
          >
            {value}
          </Link>
        </div>
      );
    if (typeof value === "string" && value.includes("doi:"))
      return (
        <div className="text-sm text-neutral-300">
          <span className="font-semibold">{camelCaseToWords(objKey)}:</span>{" "}
          <Link
            href={value.replace("doi:", "https://doi.org/")}
            target="_blank"
            className="text-blue-400 hover:underline"
          >
            {value}
          </Link>
        </div>
      );
    return (
      <div className="text-sm text-neutral-300">
        <span className="font-semibold">{camelCaseToWords(objKey)}:</span>{" "}
        {value}
        {formatUnits(units)}
      </div>
    );
  },
);

PopupContent.displayName = "PopupContent";

interface PopupFeature {
  feature: MapGeoJSONFeature;
  lng: number;
  lat: number;
}

/** Popup displayed on the map with pages if the user is hovering over multiple map features. Allows the user to download data they are hovering over */
const PaginatedPopup = ({
  features,
  ...rest
}:
  | {
      features: PopupFeature[];
      close: true;
      onClose: () => void;
      clearHover: () => void;
      onFeatureChange: (feature: MapGeoJSONFeature) => void;
    }
  | {
      features: PopupFeature[];
      close: false;
    }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mapData = useAtomValue(dataAtom);

  // Because we set the key of the component, the currentIndex resets automatically. If no key is set, uncomment the below
  // useLayoutEffect(() => {
  //   //Reset to 0 whenever the features change
  //   setCurrentIndex(0);
  // }, [features]);

  if (!features.length) return null;

  const activeFeature = features[rest.close ? currentIndex : 0]; //Force index 0 for hover popup. It should never not be 0 since pointer events is none but just in case

  if (!activeFeature) return null;

  return (
    <Popup
      longitude={activeFeature.lng}
      latitude={activeFeature.lat}
      offset={{
        top: [0, 12],
        "top-left": [0, 12],
        "top-right": [0, 12],
        bottom: [0, -12],
        "bottom-left": [0, -12],
        "bottom-right": [0, -12],
        left: [12, 0],
        right: [-12, 0],
        center: [0, 0],
      }}
      closeButton={rest.close}
      style={rest.close ? undefined : { pointerEvents: "none" }}
      onClose={rest.close ? rest.onClose : undefined}
      closeOnClick={false}
      className={cn(
        "[&.maplibregl-popup-anchor-bottom-left_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom-right_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-left_.maplibregl-popup-tip]:border-r-background [&.maplibregl-popup-anchor-right_.maplibregl-popup-tip]:border-l-background [&.maplibregl-popup-anchor-top-left_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top-right_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top_.maplibregl-popup-tip]:border-b-background [&_.maplibregl-popup-close-button:hover]:bg-neutral-800 [&_.maplibregl-popup-close-button]:px-1.5 [&_.maplibregl-popup-content]:bg-background [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md",
        !rest.close && "[&_.maplibregl-popup-content]:pointer-events-none",
      )}
    >
      <div
        className="px-4 py-3"
        onMouseEnter={rest.close ? rest.clearHover : undefined}
      >
        {activeFeature.feature.properties.name && (
          <div className="mb-2 text-lg font-semibold text-neutral-50">
            {activeFeature.feature.properties.name}
          </div>
        )}
        {Object.entries(activeFeature.feature.properties ?? {}).map(
          ([key, value]) => {
            if (key === "name" || !value) return;
            return (
              <PopupContent
                key={key}
                objKey={key}
                value={value}
                units={
                  MAP_LAYER_UNITS[activeFeature.feature.source]?.[key] ??
                  mapData[activeFeature.feature.source as keyof typeof mapData]
                    ?.units?.[key]
                }
              />
            );
          },
        )}
        {features.length >= 5 && (
          <div className="mt-2">
            <DownloadButton
              className="w-full"
              label="Download Cluster Data"
              downloadType={{
                type: "cluster",
                features: features.map((val) => val.feature),
              }}
              fileName="cluster_data"
            />
          </div>
        )}
        {features.length > 1 && (
          <div className="mt-2 flex items-center justify-end gap-2">
            Feature {currentIndex + 1} of {features.length}
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous feature"
              className="size-8"
              disabled={currentIndex <= 0}
              onClick={() => {
                setCurrentIndex((prev) => prev - 1);
                if (rest.close) {
                  rest.onFeatureChange(features[currentIndex - 1].feature);
                }
              }}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next feature"
              className="size-8"
              disabled={currentIndex >= features.length - 1}
              onClick={() => {
                setCurrentIndex((prev) => prev + 1);
                if (rest.close) {
                  rest.onFeatureChange(features[currentIndex + 1].feature);
                }
              }}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default function DatabaseMap({
  initialData,
}: {
  /** Data from database to populate filter controls */
  initialData: PopulateFilters;
}) {
  const { map } = useMap();
  const mapData = useAtomValue(dataAtom);
  const dataColors = useAtomValue(colorsAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);

  const [hoverInfo, setHoverInfo] = useState<PopupFeature[]>([]);

  const [selectedFeature, setSelectedFeature] = useState<PopupFeature[]>([]);

  const setDrawing = useSetAtom(drawingAtom);
  const ranges = useAtomValue(rangeAtom);

  const showIcons = useAtomValue(gnssIconsVisibleAtom);
  const showVectors = useAtomValue(gnssVectorsVisibleAtom);

  const onUpdate = useCallback(
    (features: GeoJSONStoreFeatures[] | undefined) => {
      if (!features || features.length === 0) return setDrawing(undefined);
      if (features.length > 1) {
        return setDrawing({
          type: "MultiPolygon",
          coordinates: features.map(
            (feature) => feature.geometry.coordinates as Position[][],
          ),
        });
      } else {
        return setDrawing({
          type: "Polygon",
          coordinates: features[0].geometry.coordinates as Position[][],
        });
      }
    },
    [setDrawing],
  );

  const onHover = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!map) return;

      const {
        features,
        lngLat: { lng, lat },
      } = event;

      // --- small helper types (local; no imports needed) ---
      type FeatureStateTarget = {
        source: string;
        id: string | number;
        sourceLayer?: string;
      };

      // Builds a safe FeatureStateTarget from a Map feature (returns null if not targetable)
      const toTarget = (f: unknown): FeatureStateTarget | null => {
        const src = (f as { layer?: { source?: string } })?.layer?.source;
        const id = (f as { id?: string | number })?.id;
        if (!src || id == null) return null;
        if (!map.getSource(src)) return null;

        const sourceLayer = (f as { layer?: { ["source-layer"]?: string } })
          ?.layer?.["source-layer"];
        const target: FeatureStateTarget = { source: src, id };
        if (sourceLayer) target.sourceLayer = sourceLayer;
        return target;
      };

      // --- 1) clear previous hover states safely ---
      if (hoverInfo && hoverInfo.length) {
        for (let i = 0; i < hoverInfo.length; i++) {
          const f = hoverInfo[i]?.feature;
          if (!f) continue;

          const target = toTarget(f);
          if (!target) continue;

          try {
            map.setFeatureState(target, { hover: false });
          } catch {
            // source/layer might have been removed mid-frame; ignore
          }
        }
      }

      // --- 2) if nothing is currently hovered, clear and exit ---
      if (!features?.length) {
        setHoverInfo([]);
        return;
      }

      // --- 3) build new hover info and set hover state ---
      const validFeatures: PopupFeature[] = [];
      for (let i = 0; i < features.length; i++) {
        const current = features[i];

        // skip layers we never want to hover
        if (
          current.source === "platesSource" ||
          current.source === "platesBoundariesSource" ||
          current.source === "platesNewSource" ||
          current.source === "platesNewBoundariesSource" ||
          current.source === "crustThicknessSource"
        ) {
          continue;
        }

        // skip features already selected (IDs are only unique within a source)
        const alreadySelected = selectedFeature.some(
          (val) =>
            val.feature.id === current.id &&
            val.feature.source === current.source,
        );
        if (alreadySelected) continue;

        // popup anchoring
        const popupLon =
          current.geometry.type === "Point"
            ? current.geometry.coordinates[0]
            : lng;
        const popupLat =
          current.geometry.type === "Point"
            ? current.geometry.coordinates[1]
            : lat;

        validFeatures.push({ feature: current, lng: popupLon, lat: popupLat });

        // set new hover state (guarded + vector-tile aware)
        const target = toTarget(current);
        if (!target) continue;

        try {
          map.setFeatureState(target, { hover: true });
        } catch {
          // ignore race conditions
        }
      }

      setHoverInfo(validFeatures);
    },
    [hoverInfo, map, selectedFeature],
  );

  const clearHover = useCallback(
    (features: PopupFeature[]) => {
      if (!map || features.length <= 0) return;
      for (let i = 0, length = features.length; i < length; i++) {
        map.setFeatureState(features[i].feature, { hover: false });
      }
      setHoverInfo([]);
    },
    [map],
  );

  const onPopupFeatureChange = useCallback(
    (feature: MapGeoJSONFeature) => {
      if (!map) return;
      // Clear all other feature hover states and set current popup feature hover state to true
      clearHover(selectedFeature);
      map.setFeatureState(feature, { hover: true });
    },
    [clearHover, map, selectedFeature],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const clickedFeatures = features;
      if (selectedFeature.length > 0) {
        // Get rid of hover state for old popup
        clearHover(selectedFeature);
      }
      if (!clickedFeatures || !map) return;
      const out: PopupFeature[] = [];
      for (let i = 0, length = clickedFeatures.length; i < length; i++) {
        const currentFeature = clickedFeatures[i];
        const popupLon =
          currentFeature.geometry.type === "Point"
            ? currentFeature.geometry.coordinates[0]
            : lng;
        const popupLat =
          currentFeature.geometry.type === "Point"
            ? currentFeature.geometry.coordinates[1]
            : lat;
        out.push({ feature: currentFeature, lng: popupLon, lat: popupLat });
      }
      setSelectedFeature(out);
      // Get rid of hover state for currently hovered features
      clearHover(hoverInfo);
      if (out.length > 0) {
        // Highlight the current feature in the popup
        map.setFeatureState(out[0].feature, { hover: true });
      }
    },
    [clearHover, hoverInfo, map, selectedFeature],
  );

  // The only way to add an SDF icon to the map is after the map has loaded
  const onLoad = useCallback(async (e: MapEvent) => {
    const image = await e.target.loadImage(triangle.src);
    if (e.target.hasImage("triangle-sdf")) return;
    e.target.addImage("triangle-sdf", image.data, { sdf: true });
  }, []);

  /** Defines the styles for each data type. Layout visibility, Source ID and Layer ID will be set automatically to
   * `key` and `key + 'Layer'` respectively.
   *  ID is required when source has multiple layers. For sources with multiple layers, the Layer IDs will be `key + id`.
   *  E.g. For seismic data, id specified of `Mw` will have a layer id of `seisMw`
   * */
  const mapDataLayers: Record<
    keyof typeof ALL_FILTERS,
    | Exclude<LayerProps, { type: "custom" }>
    | (Exclude<LayerProps, { type: "custom" }> & { id: string })[]
  > = useMemo(
    () => ({
      slip: {
        type: "fill",
        paint: {
          "fill-opacity": 0.5,
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "slip"],
            ...getInterpolateRange(ranges.slip ?? [0, 1], dataColors.slip),
          ],
        },
      },
      vlc: mapSymbolStyle(undefined, undefined, "triangle-sdf", {
        "icon-color": dataColors.vlc,
        "icon-halo-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 4],
        "icon-halo-color": "#f8fafc",
      }),
      smt: mapSymbolStyle(undefined, undefined, "triangle-sdf", {
        "icon-color": dataColors.smt,
        "icon-halo-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 4],
        "icon-halo-color": "#f8fafc",
      }),
      gnss: [
        {
          id: "Uncertainty",
          type: "fill",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#0000001A",
              "transparent",
            ],
            "fill-outline-color": "#000",
          },
          filter: ["==", "$type", "Polygon"],
        },
        {
          id: "Icon",
          type: "circle",
          paint: {
            ...commonMapCircleStyles,
            "circle-color": dataColors.gnss.icon,
            "circle-stroke-color": "#f8fafc",
          },
          filter: ["==", "$type", "Point"],
        },
        {
          id: "Label",
          ...mapSymbolStyle(undefined, 1.5),
        },
        {
          id: "Vector",
          type: "line",
          layout: {
            "line-cap": "round",
          },
          paint: {
            "line-color": dataColors.gnss.vector,
            ...commonMapLineStyles,
          },
          filter: ["==", "$type", "LineString"],
        },
        {
          id: "VectorArrow",
          type: "symbol",
          layout: {
            "symbol-placement": "line-center",
            "icon-allow-overlap": true,
            "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
            "icon-overlap": "always",
            "icon-image": "custom:arrow_9",
            "icon-rotate": 90,
          },
          filter: ["==", "$type", "LineString"],
        },
      ],
      flt: {
        type: "line",
        layout: {
          "line-cap": "round",
        },
        paint: {
          "line-color": dataColors.flt,
          ...commonMapLineStyles,
        },
      },
      slab2: {
        type: "line",
        layout: {
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "depth"],
            ...getInterpolateRange(ranges.slab2 ?? [0, 800], dataColors.slab2),
          ],
          ...commonMapLineStyles,
        },
      },
      seis: [
        getSeisProps("mw", ranges.seis, dataColors.seis),
        getSeisProps("mb", ranges.seis, dataColors.seis),
        getSeisProps("ms", ranges.seis, dataColors.seis),
        getSeisProps("none", ranges.seis, dataColors.seis),
      ],
      hf: [
        {
          id: "Icon",
          type: "circle",
          paint: {
            ...commonMapCircleStyles,
            "circle-stroke-color": [
              "interpolate",
              ["linear"],
              ["get", "qval"],
              -400,
              "#f8fafc",
              -100,
              "#000000",
              100,
              "#000000",
              400,
              "#f8fafc",
            ],
            "circle-opacity": 0.7,
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "qval"],
              ...getInterpolateRange([-400, 400], dataColors.hf),
            ],
          },
        },
        {
          id: "Label",
          ...mapSymbolStyle(undefined, 1.5),
        },
      ],
      rock: [
        {
          id: "Icon",
          type: "circle",
          paint: {
            ...commonMapCircleStyles,
            "circle-opacity": 0.7,
            "circle-color": dataColors.rock,
            "circle-stroke-color": "#f8fafc",
          },
        },
        {
          id: "Label",
          ...mapSymbolStyle(undefined, 1.5),
        },
      ],
    }),
    [ranges, dataColors],
  );

  // Gets all the layer IDs for the map's interactiveLayerIds prop
  const mapDataIds = useMemo(
    () =>
      Object.entries(mapDataLayers).reduce<(string | string[])[]>(
        (ids, [key, val]) => {
          if (Array.isArray(val)) {
            ids.push(val.map((valLayers) => `${key}${valLayers.id}`));
            return ids;
          }
          ids.push(key + "Layer");
          return ids;
        },
        [],
      ),
    [mapDataLayers],
  );

  return (
    <>
      <Controls initialData={initialData} />
      <Map
        id="map"
        initialViewState={{
          longitude: 110,
          latitude: 5,
          zoom: 4.6,
          padding: { left: 320 },
        }}
        onLoad={onLoad}
        maxZoom={15}
        mapStyle={style}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={[
          ...mapDataIds.flat(),
          "plates",
          "platesBoundaries",
          "platesNew",
          "platesNewBoundaries",
          "crustThickness",
          ...velocityStops.map((_, index) => `velocity_${index}`),
        ]}
        reuseMaps
      >
        <ScaleControl />
        <NavigationControl />
        <DrawControl modes={drawOptionsModes} open onUpdate={onUpdate} />
        <TerrainControl source={"terrain"} exaggeration={1.5} />
        <DownloadControl layerIds={mapDataIds} />
        <RestartTour />
        <Basemaps />
        <MapLayers />
        {Object.entries(mapDataLayers).map(([key, val]) => {
          const typedKey = key as keyof typeof ALL_FILTERS;
          if (!mapData[typedKey]) return null;

          return (
            <Source
              id={typedKey}
              type="geojson"
              data={mapData[typedKey].geojson}
              key={typedKey}
            >
              {Array.isArray(val) ? (
                val.map((layer) => {
                  const isGnss = typedKey === "gnss";
                  const isIconLayer =
                    isGnss && ["Icon", "Label"].includes(layer.id);
                  const isVectorLayer =
                    isGnss &&
                    ["Vector", "VectorArrow", "Uncertainty"].includes(layer.id);

                  const visible =
                    dataVisibility[typedKey] &&
                    (!isGnss ||
                      (isIconLayer && showIcons) ||
                      (isVectorLayer && showVectors) ||
                      (!isIconLayer && !isVectorLayer)); // any other GNSS sublayer
                  return (
                    <Layer
                      {...layer}
                      key={typedKey + layer.id}
                      id={typedKey + layer.id}
                      layout={{
                        ...layer.layout,
                        visibility: visible ? "visible" : "none",
                      }}
                    />
                  );
                })
              ) : (
                <Layer
                  {...val}
                  id={typedKey + "Layer"}
                  layout={{
                    ...val.layout,
                    visibility: dataVisibility[typedKey] ? "visible" : "none",
                  }}
                />
              )}
            </Source>
          );
        })}
        <PaginatedPopup features={hoverInfo} close={false} />
        <PaginatedPopup
          features={selectedFeature}
          key={selectedFeature.toString()}
          close
          clearHover={() => clearHover(hoverInfo)}
          onClose={() => setSelectedFeature([])}
          onFeatureChange={onPopupFeatureChange}
        />
      </Map>
    </>
  );
}
