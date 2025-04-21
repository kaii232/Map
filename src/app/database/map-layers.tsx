import plateVelocities from "@/assets/morvel_velocity.xlsx";
import tectonicBoundaries from "@/assets/PB2002_boundaries.json";
import tectonicPlates from "@/assets/PB2002_plates.json";
import tectonicBoundariesNew from "@/assets/plate_boundaries_new.geojson";
import tectonicPlatesNew from "@/assets/plate_new.geojson";
import { velocityStops } from "@/lib/utils";
import { Feature, FeatureCollection } from "geojson";
import { useAtomValue } from "jotai";
import { Layer, Source } from "react-map-gl/maplibre";
import { layersAtom } from "./atoms";

/** Turns a loaded xlsx file into a geojson object */
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

const morvelVelocity = xlsxToGeojson(plateVelocities);

/** Contains the source and layers for the different map layers */
export default function MapLayers() {
  const layers = useAtomValue(layersAtom);

  return (
    <>
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
                "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2],
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
    </>
  );
}
