import {
  Map,
  MapStyle,
  NavigationControl,
  ScaleControl,
} from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css"; // See notes below
import { useState } from "react";

function App() {
  const [mapIndex, setMapIndex] = useState(0);
  const MAP_STYLE: Array<MapStyle | string> = [
    "https://tiles.openfreemap.org/styles/liberty",
    {
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
    {
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
  ];
  return (
    <main className="h-screen w-full">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 rounded-xl bg-white p-4 shadow-md">
        <span className="mb-2 text-xs font-medium text-zinc-700">
          Basemap provider
        </span>
        <label className="min-w-fit grow">
          <input
            type="radio"
            name="map"
            value="openfreemap"
            defaultChecked
            className="peer/openfreemap sr-only"
            onClick={() => setMapIndex(0)}
          />
          <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked/openfreemap:ring-2 peer-focus-visible/openfreemap:outline-2">
            <img
              src="https://d4.alternativeto.net/JtcJ1s6H8N100N4sgtNEm2YThMGoMBeD53KKBPzGn3w/rs:fill:309:197:1/g:no:0:0/YWJzOi8vZGlzdC9zL29wZW5mcmVlbWFwXzk3MDE0OV9mdWxsLnBuZw.jpg"
              className="h-20 w-full rounded-md"
              alt="Open free map"
            />
            Openfreemap
          </div>
        </label>
        <label className="min-w-fit grow">
          <input
            type="radio"
            name="map"
            value="openstreetmap"
            className="peer/openstreetmap sr-only"
            onClick={() => setMapIndex(1)}
          />
          <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked/openstreetmap:ring-2 peer-focus-visible/openstreetmap:outline-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Soho_-_map_1.png/220px-Soho_-_map_1.png"
              className="h-20 w-full rounded-md"
              alt="Open free map"
            />
            Openstreetmap
          </div>
        </label>
        <label className="min-w-fit grow">
          <input
            type="radio"
            name="map"
            value="opentopomap"
            className="peer/opentopomap sr-only"
            onClick={() => setMapIndex(2)}
          />
          <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked/opentopomap:ring-2 peer-focus-visible/opentopomap:outline-2">
            <img
              src="https://latlong.blog/img/blog/2023-10-02-tracestack-topo.webp"
              className="h-20 w-full rounded-md"
              alt="Open topo map"
            />
            Opentopomap
          </div>
        </label>
      </div>
      <Map
        initialViewState={{
          longitude: -100,
          latitude: 40,
          zoom: 3.5,
        }}
        mapStyle={MAP_STYLE[mapIndex]}
      >
        <ScaleControl />
        <NavigationControl />
      </Map>
    </main>
  );
}
export default App;
