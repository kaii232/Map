"use client";

import { useAtomValue } from "jotai";
import { Layer, Source } from "react-map-gl/maplibre";
import { mapStyleAtom } from "./atoms";

/** This component contains the different basemaps available for the map */
export default function Basemaps() {
  const mapStyle = useAtomValue(mapStyleAtom);
  return (
    <>
      <Source
        id="osm"
        tiles={["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"]}
        type="raster"
        tileSize={256}
        attribution={
          "&copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors"
        }
        maxzoom={19}
      >
        <Layer
          type="raster"
          layout={{
            visibility: mapStyle === "Openstreetmap" ? "visible" : "none",
          }}
        />
      </Source>
      <Source
        id="otm"
        tiles={["https://tile.opentopomap.org/{z}/{x}/{y}.png"]}
        type="raster"
        attribution={
          "map data: &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, <a href='http://viewfinderpanoramas.org/' target='_blank'>SRTM</a> | map style: &copy; <a href='https://opentopomap.org/' target='_blank'>OpenTopoMap</a>"
        }
        maxzoom={15}
      >
        <Layer
          type="raster"
          layout={{
            visibility: mapStyle === "Opentopomap" ? "visible" : "none",
          }}
        />
      </Source>
      <Source
        id="esri"
        tiles={[
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
        ]}
        tileSize={256}
        type="raster"
        attribution={
          "Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, and the GIS User Community"
        }
        maxzoom={15}
      >
        <Layer
          type="raster"
          layout={{ visibility: mapStyle === "Satellite" ? "visible" : "none" }}
        />
      </Source>
      <Source
        id="oceanBase"
        tiles={[
          "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png",
        ]}
        tileSize={256}
        type="raster"
        attribution={
          "Esri, GEBCO, NOAA, National Geographic, Garmin, HERE, Geonames.org, and other contributors"
        }
        maxzoom={10}
      >
        <Layer
          type="raster"
          layout={{ visibility: mapStyle === "Ocean" ? "visible" : "none" }}
        />
      </Source>
      <Source
        id="oceanLayer"
        tiles={[
          "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}.png",
        ]}
        tileSize={256}
        type="raster"
        maxzoom={10}
      >
        <Layer
          type="raster"
          layout={{ visibility: mapStyle === "Ocean" ? "visible" : "none" }}
        />
      </Source>
    </>
  );
}
