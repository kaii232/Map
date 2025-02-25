"use client";

import { style } from "@/assets/map_style";
import plateVelocities from "@/assets/morvel_velocity.xlsx";
import tectonicBoundaries from "@/assets/PB2002_boundaries.json";
import tectonicPlates from "@/assets/PB2002_plates.json";
import {
  FltFilters,
  GnssFilters,
  SeisFilters,
  SmtFilters,
  VlcFilters,
} from "@/lib/types";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { Feature, FeatureCollection, Position } from "geojson";
import { useAtomValue, useSetAtom } from "jotai";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useMemo, useState } from "react";
import {
  Layer,
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
  dataVisibilityAtom,
  drawingAtom,
  fltDataAtom,
  gnssDataAtom,
  layersAtom,
  seisDataAtom,
  smtDataAtom,
  vlcDataAtom,
} from "./atoms";
import Basemaps from "./basemaps";
import Controls from "./controls";
import DrawControl from "./draw-control";

const xlsxToGeojson = (
  input: Record<string, string | number>[],
): FeatureCollection => {
  const features: Feature[] = [];
  for (let i = 0; i < input.length; i++) {
    features.push({
      type: "Feature",
      properties: {
        ...input[i],
        lon: undefined,
        lat: undefined,
      },
      geometry: {
        type: "Point",
        coordinates: [input[i].lon as number, input[i].lat as number],
      },
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

export default function DatabaseMap({
  filters,
}: {
  filters: {
    smt: SmtFilters;
    vlc: VlcFilters;
    gnss: GnssFilters;
    flt: FltFilters;
    seis: SeisFilters;
  };
}) {
  const { map } = useMap();
  const smtData = useAtomValue(smtDataAtom);
  const seisData = useAtomValue(seisDataAtom);
  const gnssData = useAtomValue(gnssDataAtom);
  const fltData = useAtomValue(fltDataAtom);
  const vlcData = useAtomValue(vlcDataAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);
  const layers = useAtomValue(layersAtom);

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
          hoveredFeature.source === "plateBoundariesSource"
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
  )[] = useMemo(
    () => ["polygon", "rectangle", "select", "delete-selection", "delete"],
    [],
  );

  const morvelVelocity = xlsxToGeojson(plateVelocities);
  const velocityStops = useMemo(
    () => [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    [],
  );
  return (
    <>
      <Controls filters={filters} />
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
          "vlc",
          "smt",
          "gnss",
          "seisMb",
          "seisMw",
          "seisMs",
          "seisNone",
          "flt",
          "plates",
          "plateBoundaries",
          ...velocityStops.map((_, index) => `velocity_${index}`),
        ]}
        reuseMaps
      >
        <ScaleControl />
        <NavigationControl />
        <DrawControl modes={drawOptionsModes} open onUpdate={onUpdate} />
        <TerrainControl source={"terrain"} exaggeration={1.5} />
        <Basemaps />
        <Source
          id="seafloorSource"
          type="raster"
          tiles={[
            `https://api.mapbox.com/v4/lance-ntu.seafloor/{z}/{x}/{y}.webp?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
          ]}
          maxzoom={5}
          tileSize={256}
        >
          <Layer
            type="raster"
            id="seafloor"
            layout={{ visibility: layers.seafloorAge ? "visible" : "none" }}
          />
        </Source>
        <Source
          id="platesSource"
          type="geojson"
          data={tectonicPlates as FeatureCollection}
        >
          <Layer
            type="fill"
            id="plates"
            paint={{
              "fill-opacity": 0,
            }}
            layout={{
              visibility: layers.tectonicPlates ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="plateBoundariesSource"
          type="geojson"
          data={tectonicBoundaries as FeatureCollection}
        >
          <Layer
            type="line"
            id="plateBoundaries"
            paint={{
              "line-color": "#065f46",
              "line-width": ["interpolate", ["linear"], ["zoom"], 5, 3, 15, 8],
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.5,
                15,
                0.3,
              ],
            }}
            layout={{
              visibility: layers.tectonicPlates ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="terrain"
          type="raster-dem"
          tiles={[
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ]}
          maxzoom={13}
          tileSize={256}
          encoding="terrarium"
          attribution={
            "* ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736;\n* Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017;\n* Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich;\n* Canada terrain data contains information licensed under the Open Government Licence – Canada;\n* Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers;\n* Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration\n* Mexico terrain data source: INEGI, Continental relief, 2016;\n* New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved);\n* Norway terrain data © Kartverket;\n* United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved;\n* United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey."
          }
        >
          <Layer
            type="hillshade"
            id="terrainHillshade"
            paint={{
              "hillshade-shadow-color": "#17292b",
              "hillshade-highlight-color": "#ebf0f5",
              "hillshade-exaggeration": 0.4,
            }}
            layout={{
              visibility: layers.hillshade ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="velocitySource"
          type="geojson"
          data={morvelVelocity}
          promoteId={"ve"}
        >
          {velocityStops.map((velocity, index) => {
            return (
              <Layer
                key={velocity}
                id={`velocity_${index}`}
                source="velocitySource"
                type="symbol"
                layout={{
                  "icon-image": `custom:arrow_${index}`,
                  "icon-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    5,
                    1,
                    10,
                    2,
                  ],
                  "icon-overlap": "always",
                  "icon-rotate": ["get", "dir"],
                  visibility: layers.plateMovementVectors ? "visible" : "none",
                }}
                filter={[
                  "all",
                  [">=", ["get", "velo"], velocity],
                  ["<", ["get", "velo"], velocity + 10],
                ]}
              />
            );
          })}
        </Source>
        {vlcData && (
          <Source id="vlcSource" type="geojson" data={vlcData}>
            <Layer
              id="vlc"
              type="symbol"
              layout={{
                "icon-image": "custom:volcano",
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Regular"],
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0.3,
                  10,
                  1,
                ],
                "text-offset": [0, 1],
                "text-anchor": "top",
                "text-size": 12,
                "text-optional": true,
                "icon-overlap": "always",
                visibility: dataVisibility.vlc ? "visible" : "none",
              }}
              paint={{
                "text-halo-color": "#F8FAFCCC",
                "text-halo-width": 2,
                "text-opacity": {
                  type: "interval",
                  stops: [
                    [7, 0],
                    [8, 1],
                  ],
                },
              }}
            />
          </Source>
        )}
        {smtData && (
          <Source id="smtSource" type="geojson" data={smtData}>
            <Layer
              id="smt"
              type="symbol"
              layout={{
                "icon-image": "custom:seamount",
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Regular"],
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0.3,
                  10,
                  1,
                ],
                "text-offset": [0, 1],
                "text-anchor": "top",
                "text-size": 12,
                "text-optional": true,
                "icon-overlap": "always",
                visibility: dataVisibility.smt ? "visible" : "none",
              }}
              paint={{
                "text-halo-color": "#F8FAFCCC",
                "text-halo-width": 2,
                "text-opacity": {
                  type: "interval",
                  stops: [
                    [7, 0],
                    [8, 1],
                  ],
                },
              }}
            />
          </Source>
        )}
        {gnssData && (
          <Source id="gnssSource" type="geojson" data={gnssData}>
            <Layer
              id="gnss"
              type="symbol"
              layout={{
                "icon-image": "custom:GNSS",
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Regular"],
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0.3,
                  10,
                  1,
                ],
                "text-offset": [0, 1],
                "text-anchor": "top",
                "text-size": 12,
                "text-optional": true,
                "icon-overlap": "always",
                visibility: dataVisibility.gnss ? "visible" : "none",
              }}
              paint={{
                "text-halo-color": "#F8FAFCCC",
                "text-halo-width": 2,
                "text-opacity": {
                  type: "interval",
                  stops: [
                    [7, 0],
                    [8, 1],
                  ],
                },
              }}
            />
          </Source>
        )}
        {fltData && (
          <Source id="fltSource" type="geojson" data={fltData}>
            <Layer
              id="flt"
              type="line"
              layout={{
                "line-cap": "round",
                visibility: dataVisibility.flt ? "visible" : "none",
              }}
              paint={{
                "line-color": "#f43f5e",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    6,
                    1,
                  ],
                  15,
                  [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    16,
                    6,
                  ],
                ],
                "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  1,
                  15,
                  0.6,
                ],
              }}
            />
          </Source>
        )}
        {seisData && (
          <Source id="seisSource" type="geojson" data={seisData}>
            <Layer
              id="seisMw"
              type="circle"
              layout={{ visibility: dataVisibility.seis ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mw"],
                    2,
                    2,
                    9,
                    6,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mw"],
                    2,
                    8,
                    9,
                    16,
                  ],
                ],
                "circle-stroke-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0,
                  13,
                  2,
                ],
                "circle-opacity": 0.7,
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "depth"],
                  4,
                  "#fff7ec",
                  8,
                  "#fee8c8",
                  16,
                  "#fdd49e",
                  32,
                  "#fdbb84",
                  64,
                  "#eb7c49",
                  128,
                  "#db5235",
                  256,
                  "#b52112",
                  512,
                  "#750606",
                  640,
                  "#120504",
                ],
              }}
              filter={["to-boolean", ["get", "mw"]]}
            />
            <Layer
              id="seisMb"
              type="circle"
              layout={{ visibility: dataVisibility.seis ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mb"],
                    2,
                    2,
                    9,
                    6,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mb"],
                    2,
                    8,
                    9,
                    16,
                  ],
                ],
                "circle-stroke-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0,
                  13,
                  2,
                ],
                "circle-opacity": 0.7,
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "depth"],
                  4,
                  "#fff7ec",
                  8,
                  "#fee8c8",
                  16,
                  "#fdd49e",
                  32,
                  "#fdbb84",
                  64,
                  "#eb7c49",
                  128,
                  "#db5235",
                  256,
                  "#b52112",
                  512,
                  "#750606",
                  640,
                  "#120504",
                ],
              }}
              filter={["to-boolean", ["get", "mb"]]}
            />
            <Layer
              id="seisMs"
              type="circle"
              layout={{ visibility: dataVisibility.seis ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "ms"],
                    2,
                    2,
                    9,
                    6,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "ms"],
                    2,
                    8,
                    9,
                    16,
                  ],
                ],
                "circle-stroke-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0,
                  13,
                  2,
                ],
                "circle-opacity": 0.7,
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "depth"],
                  4,
                  "#fff7ec",
                  8,
                  "#fee8c8",
                  16,
                  "#fdd49e",
                  32,
                  "#fdbb84",
                  64,
                  "#eb7c49",
                  128,
                  "#db5235",
                  256,
                  "#b52112",
                  512,
                  "#750606",
                  640,
                  "#120504",
                ],
              }}
              filter={["to-boolean", ["get", "ms"]]}
            />
            <Layer
              id="seisNone"
              type="circle"
              layout={{ visibility: dataVisibility.seis ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  2,
                  15,
                  12,
                ],
                "circle-stroke-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0,
                  13,
                  2,
                ],
                "circle-opacity": 0.7,
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "depth"],
                  4,
                  "#fff7ec",
                  8,
                  "#fee8c8",
                  16,
                  "#fdd49e",
                  32,
                  "#fdbb84",
                  64,
                  "#eb7c49",
                  128,
                  "#db5235",
                  256,
                  "#b52112",
                  512,
                  "#750606",
                  640,
                  "#120504",
                ],
              }}
              filter={[
                "all",
                ["!", ["to-boolean", ["get", "mb"]]],
                ["!", ["to-boolean", ["get", "mw"]]],
                ["!", ["to-boolean", ["get", "ms"]]],
              ]}
            />
          </Source>
        )}
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
              <div className="mb-2 text-lg font-semibold">
                {hoverInfo.feature.properties.name}
              </div>
            )}
            {Object.entries(hoverInfo.feature.properties).map(
              ([key, value]) => {
                if (key === "name") return;
                return (
                  <div className="text-sm" key={key}>
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
              <div className="mb-2 text-lg font-semibold">
                {selectedFeature.feature.properties.name}
              </div>
            )}
            {Object.entries(selectedFeature.feature.properties).map(
              ([key, value]) => {
                if (key === "name") return;
                return (
                  <div className="text-sm" key={key}>
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
