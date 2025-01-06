import {
  Layer,
  Map,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  MapStyle,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  useMap,
} from "@vis.gl/react-maplibre";
import { ChevronsUpDown, Download } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useState } from "react";
import faultData from "./assets/philippines_faults_2020.geojson";
import { Button } from "./components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible";
import { Switch } from "./components/ui/switch";

const MAP_STYLE: {
  style: MapStyle | string;
  label: string;
  img: string;
}[] = [
  {
    style: "https://tiles.openfreemap.org/styles/liberty",
    label: "Openfreemap",
    img: "https://d4.alternativeto.net/JtcJ1s6H8N100N4sgtNEm2YThMGoMBeD53KKBPzGn3w/rs:fill:309:197:1/g:no:0:0/YWJzOi8vZGlzdC9zL29wZW5mcmVlbWFwXzk3MDE0OV9mdWxsLnBuZw.jpg",
  },
  {
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution:
            "&copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
        },
      ],
    },
    label: "Openstreetmap",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Soho_-_map_1.png/220px-Soho_-_map_1.png",
  },
  {
    style: {
      version: 8,
      sources: {
        otm: {
          type: "raster",
          tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png "],
          maxzoom: 15,
          attribution:
            "map data: &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, <a href='http://viewfinderpanoramas.org/' target='_blank'>SRTM</a> | map style: &copy; <a href='https://opentopomap.org/' target='_blank'>OpenTopoMap</a>",
        },
      },
      layers: [
        {
          id: "otm",
          type: "raster",
          source: "otm",
        },
      ],
    },
    label: "Opentopomap",
    img: "https://latlong.blog/img/blog/2023-10-02-tracestack-topo.webp",
  },
  {
    style: {
      version: 8,
      sources: {
        esri: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
          ],
          tileSize: 256,
          attribution:
            "Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, and the GIS User Community",
        },
      },
      layers: [
        {
          id: "esri",
          type: "raster",
          source: "esri",
        },
      ],
    },
    label: "Satellite",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXhvrlM50ZXAuvt7S8uXh9My90_uTQf9cyYg&s",
  },
  {
    style: {
      version: 8,
      sources: {
        ocean: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png",
          ],
          maxzoom: 10,
          tileSize: 256,
          attribution:
            "Esri, GEBCO, NOAA, National Geographic, Garmin, HERE, Geonames.org, and other contributors",
        },
        oceanRef: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}.png",
          ],
          maxzoom: 10,
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "ocean",
          type: "raster",
          source: "ocean",
        },
        {
          id: "oceanRef",
          type: "raster",
          source: "oceanRef",
        },
      ],
    },
    label: "Ocean",
    img: "https://learn.arcgis.com/en/projects/find-ocean-bathymetry-data/GUID-FE9C4F4D-E9AA-46CD-9C3F-D7DB28FBCBCC-web.png",
  },
];

function App() {
  const { map } = useMap();
  const [showFault, setShowFault] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<{
    feature: MapGeoJSONFeature;
    lng: number;
    lat: number;
  } | null>(null);
  const [mapIndex, setMapIndex] = useState(0);
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
            { source: "fault", id: hoverInfo.feature.id },
            { hover: false },
          );
        }
        setHoverInfo({ feature: hoveredFeature, lng, lat });
        map.setFeatureState(
          { source: "fault", id: hoveredFeature.id },
          { hover: true },
        );
      } else if (map) {
        if (hoverInfo) {
          map.setFeatureState(
            { source: "fault", id: hoverInfo.feature.id },
            { hover: false },
          );
        }
        setHoverInfo(null);
      }
    },
    [hoverInfo, map],
  );

  return (
    <main className="h-screen w-full">
      <Collapsible
        className="absolute left-4 top-4 z-10 flex max-h-[calc(100vh-32px)] w-52 flex-col gap-4"
        defaultOpen={false}
      >
        <div className="flex flex-col overflow-hidden rounded-xl bg-white p-2 shadow-md">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md p-3 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
            Basemap provider
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex shrink flex-col gap-2 overflow-auto data-[state=open]:p-1">
            {MAP_STYLE.map((style, index) => {
              return (
                <label className="min-w-fit grow" key={style.label}>
                  <input
                    type="radio"
                    name="map"
                    value={style.label}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                    onClick={() => setMapIndex(index)}
                  />
                  <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked:ring-2 peer-focus-visible:outline-2">
                    <img
                      src={style.img}
                      className="h-20 w-full rounded-md"
                      alt={style.label}
                    />
                    {style.label}
                  </div>
                </label>
              );
            })}
          </CollapsibleContent>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <label
              htmlFor="switch"
              className="text-xs font-medium text-zinc-700"
            >
              Show faults
            </label>
            <Switch
              id="switch"
              checked={showFault}
              onCheckedChange={(e) => setShowFault(e)}
            />
          </div>
          <Button asChild className="w-full">
            <a href="./assets/philippines_faults_2020.geojson" download>
              <Download /> Download
            </a>
          </Button>
        </div>
      </Collapsible>
      <Map
        id="map"
        initialViewState={{
          longitude: 110,
          latitude: 5,
          zoom: 5,
        }}
        maxZoom={15}
        mapStyle={MAP_STYLE[mapIndex].style}
        onMouseMove={onHover}
        interactiveLayerIds={["faultLines"]}
      >
        <ScaleControl />
        <NavigationControl />
        {showFault && (
          <Source
            id="fault"
            type="geojson"
            data={faultData}
            promoteId="globalid"
          >
            <Layer
              id="faultLines"
              type="line"
              layout={{
                "line-cap": "round",
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
                "line-width-transition": { duration: 500 },
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
            className={
              "[&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            <div className="mb-2 text-lg font-semibold">
              {hoverInfo.feature.properties.d_fname}
            </div>
            <div className="text-sm">
              <span className="font-semibold">ttcode:</span>{" "}
              {hoverInfo.feature.properties.d_ttcode}
            </div>
            <div className="text-sm">
              <span className="font-semibold">fccode:</span>{" "}
              {hoverInfo.feature.properties.d_fccode}
            </div>
          </Popup>
        )}
      </Map>
    </main>
  );
}
export default App;
