"use client";

import { style } from "@/assets/map_style";
import { ALL_FILTERS } from "@/lib/filters";
import { GenericFiltersInfo, Range } from "@/lib/types";
import { velocityStops } from "@/lib/utils";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { Position } from "geojson";
import { useAtomValue, useSetAtom } from "jotai";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Layer,
  LayerProps,
  Map,
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
import {
  dataAtom,
  dataVisibilityAtom,
  drawingAtom,
  slipRangeAtom,
} from "./atoms";
import Basemaps from "./basemaps";
import Controls from "./controls";
import DownloadControl from "./download-control";
import DrawControl from "./draw-control";
import MapLayers from "./map-layers";

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

// Convenience function to get the layer props for seismic data
const getSeisProps = (
  property: "none" | "mb" | "mw" | "ms",
): LayerProps & { id: string } => ({
  id: property.charAt(0).toUpperCase() + property.substring(1),
  type: "circle",
  paint: {
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0, 8, 2],
    "circle-stroke-color": [
      "interpolate",
      ["linear"],
      ["get", "depth"],
      0,
      "#000000",
      640,
      "#f8fafc",
    ],
    "circle-opacity": 0.7,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "depth"],
      2,
      "#fff7ec",
      4,
      "#fee8c8",
      8,
      "#fdd49e",
      16,
      "#fdbb84",
      32,
      "#eb7c49",
      64,
      "#db5235",
      128,
      "#b52112",
      256,
      "#750606",
      512,
      "#120504",
      1024,
      "#000000",
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
            ["interpolate", ["exponential", 2], ["get", property], 2, 8, 9, 24],
          ]
        : ["interpolate", ["linear"], ["zoom"], 5, 3, 15, 12],
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

// Convenience function to map a range to user defined stops for map layer style specification
const getInterpolateRange = (range: Range, stops: (string | number)[]) => {
  const step = (range[1] - range[0]) / (stops.length - 1);
  const out = [];
  for (let i = 0, length = stops.length; i < length; i++) {
    out.push(range[0] + i * step);
    out.push(stops[i]);
  }
  return out;
};

export default function DatabaseMap({
  initialData,
}: {
  initialData: Record<keyof typeof ALL_FILTERS, GenericFiltersInfo>;
}) {
  const { map } = useMap();
  const mapData = useAtomValue(dataAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);

  const [hoverInfo, setHoverInfo] = useState<{
    feature: MapGeoJSONFeature;
    lng: number;
    lat: number;
  }>();

  const [selectedFeature, setselectedFeature] = useState<{
    feature: MapGeoJSONFeature;
    lng: number;
    lat: number;
  }>();

  const setDrawing = useSetAtom(drawingAtom);
  const slipRange = useAtomValue(slipRangeAtom);

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
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const hoveredFeature = features && features[0];
      if (hoveredFeature && map) {
        if (hoverInfo) {
          map.setFeatureState(
            {
              source: hoverInfo.feature.layer.source,
              id: hoverInfo.feature.id,
            },
            { hover: false },
          );
        }
        if (
          hoveredFeature.source === "platesSource" ||
          hoveredFeature.source === "platesBoundariesSource" ||
          hoveredFeature.source === "platesNewSource" ||
          hoveredFeature.source === "platesNewBoundariesSource"
        ) {
          setHoverInfo(undefined);
          return;
        }
        if (
          !selectedFeature ||
          (selectedFeature && selectedFeature.feature.id !== hoveredFeature.id)
        ) {
          const popupLon =
            hoveredFeature.geometry.type === "Point"
              ? hoveredFeature.geometry.coordinates[0]
              : lng;
          const popupLat =
            hoveredFeature.geometry.type === "Point"
              ? hoveredFeature.geometry.coordinates[1]
              : lat;
          setHoverInfo({
            feature: hoveredFeature,
            lng: popupLon,
            lat: popupLat,
          });
          map.setFeatureState(
            { source: hoveredFeature.layer.source, id: hoveredFeature.id },
            { hover: true },
          );
        }
      } else if (map) {
        if (hoverInfo) {
          map.setFeatureState(
            {
              source: hoverInfo.feature.layer.source,
              id: hoverInfo.feature.id,
            },
            { hover: false },
          );
          setHoverInfo(undefined);
        }
      }
    },
    [hoverInfo, map, selectedFeature],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const clicked = features && features[0];
      if (clicked && map) {
        const popupLon =
          clicked.geometry.type === "Point"
            ? clicked.geometry.coordinates[0]
            : lng;
        const popupLat =
          clicked.geometry.type === "Point"
            ? clicked.geometry.coordinates[1]
            : lat;
        setselectedFeature({ feature: clicked, lng: popupLon, lat: popupLat });
      }
    },
    [map],
  );

  // Defined the styles for each data type. Layout visibility, Source ID and Layer ID will be set automatically
  // ID is required when source has multiple layers. Final Layer ID will automatically be key + id.
  // E.g. For seismic data, id specified of "Mw" will have a layer id of "seisMw"
  const mapDataLayers: Record<
    keyof typeof ALL_FILTERS,
    LayerProps | (LayerProps & { id: string })[]
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
            ...getInterpolateRange(slipRange, [
              "#FCFDBF",
              "#FDDC9E",
              "#FD9869",
              "#F8765C",
              "#D3436E",
              "#B63779",
              "#7B2382",
              "#5F187F",
              "#231151",
              "#0C0927",
              "#000004",
            ]),
          ],
        },
      },
      vlc: {
        type: "symbol",
        layout: {
          "icon-image": "custom:volcano",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
          "text-offset": [0, 1],
          "text-anchor": "top",
          "text-size": 12,
          "text-optional": true,
          "icon-overlap": "always",
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
        },
      },
      smt: {
        type: "symbol",
        layout: {
          "icon-image": "custom:seamount",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
          "text-offset": [0, 1],
          "text-anchor": "top",
          "text-size": 12,
          "text-optional": true,
          "icon-overlap": "always",
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
        },
      },
      gnss: {
        type: "symbol",
        layout: {
          "icon-image": "custom:GNSS",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
          "text-offset": [0, 1],
          "text-anchor": "top",
          "text-size": 12,
          "text-optional": true,
          "icon-overlap": "always",
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
        },
      },
      flt: {
        type: "line",
        layout: {
          "line-cap": "round",
        },
        paint: {
          "line-color": "#f43f5e",
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
            0,
            "#ffffa4",
            200,
            "#fca309",
            400,
            "#db503b",
            600,
            "#922568",
            800,
            "#400a67",
            1000,
            "#fff",
          ],
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
        },
      },
      seis: [
        getSeisProps("mw"),
        getSeisProps("mb"),
        getSeisProps("ms"),
        getSeisProps("none"),
      ],
      hf: {
        type: "circle",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 15, 12],
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0,
            8,
            2,
          ],
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
            -400,
            "#0c4a6e",
            -200,
            "#0284c7",
            0,
            "#eeeeee",
            200,
            "#e11d48",
            400,
            "#4c0519",
          ],
        },
      },
    }),
    [slipRange],
  );

  // Gets all the layer IDs for the map's interactiveLayerIds prop
  const mapDataIds = useMemo(
    () =>
      Object.entries(mapDataLayers).reduce<string[]>((ids, [key, val]) => {
        if (Array.isArray(val)) {
          return ids.concat(val.map((valLayers) => `${key}${valLayers.id}`));
        }
        ids.push(key);
        return ids;
      }, []),
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
        maxZoom={15}
        mapStyle={style}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={[
          ...mapDataIds,
          "plates",
          "platesBoundaries",
          "platesNew",
          "platesNewBoundaries",
          ...velocityStops.map((_, index) => `velocity_${index}`),
        ]}
        reuseMaps
      >
        <ScaleControl />
        <NavigationControl />
        <DrawControl modes={drawOptionsModes} open onUpdate={onUpdate} />
        <TerrainControl source={"terrain"} exaggeration={1.5} />
        <DownloadControl />
        <Basemaps />
        <MapLayers />
        {Object.entries(mapDataLayers).map(([key, val]) => {
          const typedKey = key as keyof typeof ALL_FILTERS;
          if (!mapData[typedKey]) return null;

          return (
            <Source
              id={typedKey + "Source"}
              type="geojson"
              data={mapData[typedKey]}
              key={typedKey}
            >
              {Array.isArray(val) ? (
                val.map((layer) => {
                  return (
                    <Layer
                      {...layer}
                      key={typedKey + layer.id}
                      id={typedKey + layer.id}
                      //@ts-expect-error Discriminated union can't properly be distinguished due to dynamic mapping
                      layout={{
                        //@ts-expect-error Discriminated union can't properly be distinguished due to dynamic mapping
                        ...layer.layout,
                        visibility: dataVisibility[typedKey]
                          ? "visible"
                          : "none",
                      }}
                    />
                  );
                })
              ) : (
                <Layer
                  {...val}
                  id={typedKey}
                  //@ts-expect-error Discriminated union can't properly be distinguished due to dynamic mapping
                  layout={{
                    //@ts-expect-error Discriminated union can't properly be distinguished due to dynamic mapping
                    ...val.layout,
                    visibility: dataVisibility[typedKey] ? "visible" : "none",
                  }}
                />
              )}
            </Source>
          );
        })}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lng}
            latitude={hoverInfo.lat}
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
            closeButton={false}
            closeOnClick={true}
            className={
              "[&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            {hoverInfo.feature.properties.name && (
              <div className="mb-2 text-lg font-semibold text-neutral-900">
                {hoverInfo.feature.properties.name}
              </div>
            )}
            {Object.entries(hoverInfo.feature.properties).map(
              ([key, value]) => {
                if (key === "name") return;
                if (typeof value === "string" && value.includes("https://"))
                  return (
                    <div className="text-sm text-neutral-700" key={key}>
                      <span className="font-semibold">{key}:</span>{" "}
                      <Link
                        href={value}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {value}
                      </Link>
                    </div>
                  );

                return (
                  <div className="text-sm text-neutral-700" key={key}>
                    <span className="font-semibold">{key}:</span> {value}
                  </div>
                );
              },
            )}
          </Popup>
        )}
        {selectedFeature && (
          <Popup
            key={`${selectedFeature.feature.id}click`}
            longitude={selectedFeature.lng}
            latitude={selectedFeature.lat}
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
            closeButton={true}
            onClose={() => setselectedFeature(undefined)}
            closeOnClick={false}
            className={
              "[&_.maplibregl-popup-close-button]:px-1.5 [&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            {selectedFeature.feature.properties.name && (
              <div className="mb-2 text-lg font-semibold text-neutral-900">
                {selectedFeature.feature.properties.name}
              </div>
            )}
            {Object.entries(selectedFeature.feature.properties).map(
              ([key, value]) => {
                if (key === "name") return;
                if (typeof value === "string" && value.includes("https://"))
                  return (
                    <div className="text-sm text-neutral-700" key={key}>
                      <span className="font-semibold">{key}:</span>{" "}
                      <Link
                        href={value}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {value}
                      </Link>
                    </div>
                  );
                if (typeof value === "string" && value.includes("doi:"))
                  return (
                    <div className="text-sm text-neutral-700" key={key}>
                      <span className="font-semibold">{key}:</span>{" "}
                      <Link
                        href={value.replace("doi:", "https://doi.org/")}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {value}
                      </Link>
                    </div>
                  );
                return (
                  <div className="text-sm text-neutral-700" key={key}>
                    <span className="font-semibold">{key}:</span> {value}
                  </div>
                );
              },
            )}
          </Popup>
        )}
      </Map>
    </>
  );
}
