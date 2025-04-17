"use client";

import { style } from "@/assets/map_style";
import plateVelocities from "@/assets/morvel_velocity.xlsx";
import tectonicBoundaries from "@/assets/PB2002_boundaries.json";
import tectonicPlates from "@/assets/PB2002_plates.json";
import tectonicBoundariesNew from "@/assets/plate_boundaries_new.geojson";
import tectonicPlatesNew from "@/assets/plate_new.geojson";
import { ALL_FILTERS } from "@/lib/filters";
import { GenericFiltersInfo } from "@/lib/types";
import { velocityStops } from "@/lib/utils";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { Feature, FeatureCollection, Position } from "geojson";
import { useAtomValue, useSetAtom } from "jotai";
import {
  ColorSpecification,
  DataDrivenPropertyValueSpecification,
  PropertyValueSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
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
import { dataAtom, dataVisibilityAtom, drawingAtom, layersAtom } from "./atoms";
import Basemaps from "./basemaps";
import Controls from "./controls";
import DownloadControl from "./download-control";
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
      },
      geometry: {
        type: "Point",
        coordinates: [
          input[i].Longitude as number,
          input[i].Latitude as number,
        ],
      },
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

const seisCommonPaint: {
  "circle-radius"?: DataDrivenPropertyValueSpecification<number>;
  "circle-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  "circle-blur"?: DataDrivenPropertyValueSpecification<number>;
  "circle-opacity"?: DataDrivenPropertyValueSpecification<number>;
  "circle-translate"?: PropertyValueSpecification<[number, number]>;
  "circle-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;
  "circle-pitch-scale"?: PropertyValueSpecification<"map" | "viewport">;
  "circle-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport">;
  "circle-stroke-width"?: DataDrivenPropertyValueSpecification<number>;
  "circle-stroke-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  "circle-stroke-opacity"?: DataDrivenPropertyValueSpecification<number>;
} = {
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
};

export default function DatabaseMap({
  initialData,
}: {
  initialData: Record<keyof typeof ALL_FILTERS, GenericFiltersInfo>;
}) {
  const { map } = useMap();
  const mapData = useAtomValue(dataAtom);
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

  const morvelVelocity = useMemo(() => xlsxToGeojson(plateVelocities), []);

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
          "vlc",
          "smt",
          "gnss",
          "seisMb",
          "seisMw",
          "seisMs",
          "seisNone",
          "flt",
          "hf",
          "slab2",
          "plates",
          "plateBoundaries",
          "platesNew",
          "plateBoundariesNew",
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
        <Source
          id="seafloorAgeSource"
          type="raster"
          tiles={[
            `https://api.mapbox.com/v4/lance-ntu.b559fikp/{z}/{x}/{y}.webp?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
          ]}
          maxzoom={5}
          tileSize={256}
        >
          <Layer
            type="raster"
            id="seafloorAge"
            layout={{ visibility: layers.seafloorAge ? "visible" : "none" }}
            paint={{ "raster-opacity": 0.8, "raster-resampling": "nearest" }}
          />
        </Source>
        <Source
          id="platesSource"
          type="geojson"
          data={tectonicPlates as FeatureCollection}
          generateId
        >
          <Layer
            type="fill"
            id="plates"
            paint={{
              "fill-opacity": 0,
            }}
            layout={{
              visibility: layers.plates ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="platesBoundariesSource"
          type="geojson"
          data={tectonicBoundaries as FeatureCollection}
          generateId
        >
          <Layer
            type="line"
            id="platesBoundaries"
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
              visibility: layers.plates ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="platesNewSource"
          type="geojson"
          data={tectonicPlatesNew as FeatureCollection}
          promoteId={"id"}
        >
          <Layer
            type="fill"
            id="platesNew"
            paint={{
              "fill-opacity": 0,
            }}
            layout={{
              visibility: layers.platesNew ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="platesNewBoundariesSource"
          type="geojson"
          data={tectonicBoundariesNew as FeatureCollection}
          promoteId={"feature_id"}
          attribution={
            "Hasterok, D., Halpin, J., Hand, M., Collins, A., Kreemer, C., Gard, M.G., Glorie, S., (revised) New maps of global geologic provinces and tectonic plates, Earth Science Reviews."
          }
        >
          <Layer
            type="line"
            id="platesNewBoundaries"
            paint={{
              "line-color": "#4c1d95",
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
              visibility: layers.platesNew ? "visible" : "none",
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
              "hillshade-illumination-anchor": "map",
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
          generateId
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
                  "icon-rotate": ["get", "Direction"],
                  visibility: layers.plateMovementVectors ? "visible" : "none",
                }}
                filter={[
                  "all",
                  [">=", ["get", "Velocity (mm/yr)"], velocity],
                  ["<", ["get", "Velocity (mm/yr)"], velocity + 10],
                ]}
              />
            );
          })}
        </Source>
        {mapData.vlc && (
          <Source id="vlcSource" type="geojson" data={mapData.vlc}>
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
        {mapData.smt && (
          <Source id="smtSource" type="geojson" data={mapData.smt}>
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
        {mapData.gnss && (
          <Source id="gnssSource" type="geojson" data={mapData.gnss}>
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
        {mapData.flt && (
          <Source id="fltSource" type="geojson" data={mapData.flt}>
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
        {mapData.slab2 && (
          <Source id="slab2Source" type="geojson" data={mapData.slab2}>
            <Layer
              id="slab2"
              type="line"
              layout={{
                "line-cap": "round",
                visibility: dataVisibility.slab2 ? "visible" : "none",
              }}
              paint={{
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
        {mapData.seis && (
          <Source id="seisSource" type="geojson" data={mapData.seis}>
            <Layer
              id="seisMw"
              type="circle"
              layout={{ visibility: dataVisibility.seis ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mw"],
                    2,
                    3,
                    9,
                    12,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mw"],
                    2,
                    8,
                    9,
                    24,
                  ],
                ],
                ...seisCommonPaint,
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
                  5,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mb"],
                    2,
                    3,
                    9,
                    12,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "mb"],
                    2,
                    8,
                    9,
                    24,
                  ],
                ],
                ...seisCommonPaint,
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
                  5,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "ms"],
                    2,
                    3,
                    9,
                    12,
                  ],
                  15,
                  [
                    "interpolate",
                    ["exponential", 2],
                    ["get", "ms"],
                    2,
                    8,
                    9,
                    24,
                  ],
                ],
                ...seisCommonPaint,
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
                  5,
                  3,
                  15,
                  12,
                ],
                ...seisCommonPaint,
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
        {mapData.hf && (
          <Source id="hfSource" type="geojson" data={mapData.hf}>
            <Layer
              id="hf"
              type="circle"
              layout={{ visibility: dataVisibility.hf ? "visible" : "none" }}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  3,
                  15,
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
              }}
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
