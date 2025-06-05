"use client";

import { style } from "@/assets/map_style";
import type { ALL_FILTERS, PopulateFilters } from "@/lib/data-definitions";
import {
  camelCaseToWords,
  getInterpolateRange,
  velocityStops,
} from "@/lib/utils";
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
      "#360A07",
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

const mapSymbolStyle = (
  get: string = "name",
  offset: number = 1.2,
  icon?: string,
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
  };
};

const PopupContent = ({
  objKey,
  value,
  units,
}: {
  objKey: string;
  value: string | number;
  units?: string;
}) => {
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
      <span className="font-semibold">{camelCaseToWords(objKey)}:</span> {value}
      {units}
    </div>
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
      if (!map) return;
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const hoveredFeature = features && features[0];
      if (hoverInfo) {
        // Old hover info
        map.setFeatureState(
          {
            source: hoverInfo.feature.layer.source,
            id: hoverInfo.feature.id,
          },
          { hover: false },
        );
      }
      if (
        !hoveredFeature ||
        hoveredFeature.source === "platesSource" ||
        hoveredFeature.source === "platesBoundariesSource" ||
        hoveredFeature.source === "platesNewSource" ||
        hoveredFeature.source === "platesNewBoundariesSource" ||
        hoveredFeature.source === "crustThicknessSource"
      ) {
        setHoverInfo(undefined);
        return;
      }
      if (
        !selectedFeature ||
        (selectedFeature &&
          (selectedFeature.feature.source !== hoveredFeature.source ||
            selectedFeature.feature.id !== hoveredFeature.id)) // IDs are only unique within each source
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
    },
    [hoverInfo, map, selectedFeature],
  );

  const clearHover = useCallback(() => {
    if (!map || !hoverInfo) return;
    map.setFeatureState(
      {
        source: hoverInfo.feature.layer.source,
        id: hoverInfo.feature.id,
      },
      { hover: false },
    );
    setHoverInfo(undefined);
  }, [map, hoverInfo]);

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
        clearHover();
      }
    },
    [clearHover, map],
  );

  /** Defines the styles for each data type. Layout visibility, Source ID and Layer ID will be set automatically to
   * `key + Source` and `key` respectively.
   *  ID is required when source has multiple layers. For sources with multiple layers, the Layer IDs will be `key + id`.
   *  E.g. For seismic data, id specified of `Mw` will have a layer id of `seisMw`
   * */
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
      vlc: mapSymbolStyle(undefined, undefined, "custom:volcano"),
      smt: mapSymbolStyle(undefined, undefined, "custom:seamount"),
      gnss: [
        {
          id: "Icon",
          type: "circle",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              3,
              12,
              12,
            ],
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0,
              8,
              2,
            ],
            "circle-color": "#E39F40",
            "circle-stroke-color": "#f8fafc",
          },
        },
        {
          id: "Label",
          ...mapSymbolStyle(undefined, 1.5),
        },
      ],
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
            ...getInterpolateRange(
              [0, 1000],
              ["#ffffa4", "#fca309", "#db503b", "#922568", "#400a67", "#fff"],
            ),
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
      hf: [
        {
          id: "Icon",
          type: "circle",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              3,
              12,
              12,
            ],
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
              ...getInterpolateRange(
                [-400, 400],
                ["#0c4a6e", "#0284c7", "#eeeeee", "#e11d48", "#4c0519"],
              ),
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
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              3,
              12,
              12,
            ],
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0,
              8,
              2,
            ],
            "circle-opacity": 0.7,
            "circle-color": "#b85a1f",
            "circle-stroke-color": "#f8fafc",
          },
        },
        {
          id: "Label",
          ...mapSymbolStyle(undefined, 1.5),
        },
      ],
    }),
    [slipRange],
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
          ids.push(key);
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
              id={typedKey + "Source"}
              type="geojson"
              data={mapData[typedKey].geojson}
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
            style={{ pointerEvents: "none" }}
            closeButton={false}
            closeOnClick={true}
            className={
              "[&.maplibregl-popup-anchor-bottom-left_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom-right_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-left_.maplibregl-popup-tip]:border-r-background [&.maplibregl-popup-anchor-right_.maplibregl-popup-tip]:border-l-background [&.maplibregl-popup-anchor-top-left_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top-right_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top_.maplibregl-popup-tip]:border-b-background [&_.maplibregl-popup-content]:pointer-events-none [&_.maplibregl-popup-content]:bg-background [&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            {hoverInfo.feature.properties.name && (
              <div className="mb-2 text-lg font-semibold text-neutral-50">
                {hoverInfo.feature.properties.name}
              </div>
            )}
            {Object.entries(hoverInfo.feature.properties).map(
              ([key, value]) => {
                if (key === "name" || !value) return;
                return (
                  <PopupContent
                    key={key}
                    objKey={key}
                    value={value}
                    units={
                      mapData[
                        hoverInfo.feature.source.slice(
                          0,
                          -6,
                        ) as keyof typeof mapData
                      ]?.units?.[key]
                    }
                  />
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
              "[&.maplibregl-popup-anchor-bottom-left_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom-right_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-bottom_.maplibregl-popup-tip]:border-t-background [&.maplibregl-popup-anchor-left_.maplibregl-popup-tip]:border-r-background [&.maplibregl-popup-anchor-right_.maplibregl-popup-tip]:border-l-background [&.maplibregl-popup-anchor-top-left_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top-right_.maplibregl-popup-tip]:border-b-background [&.maplibregl-popup-anchor-top_.maplibregl-popup-tip]:border-b-background [&_.maplibregl-popup-close-button:hover]:bg-neutral-800 [&_.maplibregl-popup-close-button]:px-1.5 [&_.maplibregl-popup-content]:bg-background [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            <div className="px-4 py-3" onMouseEnter={clearHover}>
              {selectedFeature.feature.properties.name && (
                <div className="mb-2 text-lg font-semibold text-neutral-50">
                  {selectedFeature.feature.properties.name}
                </div>
              )}
              {Object.entries(selectedFeature.feature.properties).map(
                ([key, value]) => {
                  if (key === "name" || !value) return;
                  return (
                    <PopupContent
                      key={key}
                      objKey={key}
                      value={value}
                      units={
                        mapData[
                          selectedFeature.feature.source.slice(
                            0,
                            -6,
                          ) as keyof typeof mapData
                        ]?.units?.[key]
                      }
                    />
                  );
                },
              )}
            </div>
          </Popup>
        )}
      </Map>
    </>
  );
}
