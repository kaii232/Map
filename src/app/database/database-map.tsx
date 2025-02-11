"use client";

import {
  FltFilters,
  GnssFilters,
  SeisFilters,
  SmtFilters,
  VlcFilters,
} from "@/lib/types";
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
} from "@vis.gl/react-maplibre";
import { useAtomValue } from "jotai";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import gnssIcon from "../../assets/GNSS_icon.png";
import seamountIcon from "../../assets/seamount_icon.png";
import volanoIcon from "../../assets/volcano_icon.png";
import {
  dataVisibilityAtom,
  fltDataAtom,
  gnssDataAtom,
  layersAtom,
  mapStyleAtom,
  seisDataAtom,
  smtDataAtom,
  vlcDataAtom,
} from "./atoms";
import Controls from "./controls";

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
  const mapStyle = useAtomValue(mapStyleAtom);
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
          !selectedFeature ||
          (selectedFeature && selectedFeature.feature.id !== hoveredFeature.id)
        ) {
          setHoverInfo({ feature: hoveredFeature, lng, lat });
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
        }
        setHoverInfo(undefined);
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
        setselectedFeature({ feature: clicked, lng, lat });
      }
    },
    [map],
  );

  useEffect(() => {
    const addImages = async () => {
      if (map) {
        try {
          const [volcanoImg, smtImg, gnssImg] = await Promise.all([
            map.loadImage(volanoIcon.src),
            map.loadImage(seamountIcon.src),
            map.loadImage(gnssIcon.src),
          ]);
          map.addImage("volcano_icon", volcanoImg.data);
          map.addImage("smt_icon", smtImg.data);
          map.addImage("gnss_icon", gnssImg.data);
        } catch {
          console.log("Images already exists");
        }
      }
    };
    addImages();
  }, [map, mapStyle]);

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
        mapStyle={mapStyle}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={["vlc", "smt", "gnss", "seis", "flt"]}
        reuseMaps
      >
        <ScaleControl />
        <NavigationControl />
        <TerrainControl source={"terrain"} exaggeration={1.5} />
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
            layout={{ visibility: layers.seafloor ? "visible" : "none" }}
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
          terrain={{ source: "terrain", exaggeration: 1.5 }}
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
        {vlcData && (
          <Source id="vlcSource" type="geojson" data={vlcData}>
            <Layer
              id="vlc"
              type="symbol"
              layout={{
                "icon-image": "volcano_icon",
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
                "icon-image": "smt_icon",
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
                "icon-image": "gnss_icon",
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
              id="seis"
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
                    8,
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
