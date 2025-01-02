import { Map, NavigationControl, ScaleControl } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css"; // See notes below

function App() {
  // const [mapStyle, setMapStyle] = useState<string>(
  //   "https://tiles.openfreemap.org/styles/liberty"
  // );
  // const MAP_STYLE: MapStyle = {
  //   version: 8,
  //   sources: {
  //     osm: {
  //       type: "raster",
  //       tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
  //       tileSize: 256,
  //       attribution: "&copy; OpenStreetMap Contributors",
  //       maxzoom: 19,
  //     },
  //   },
  //   layers: [
  //     {
  //       id: "osm",
  //       type: "raster",
  //       source: "osm",
  //     },
  //   ],
  // };
  return (
    <main className="h-screen w-full">
      <div className="absolute top-4 left-4 z-10 shadow-md bg-white rounded-xl p-4 flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-700 mb-2">
          Basemap provider
        </span>
        <label className="min-w-fit flex-grow">
          <input
            type="radio"
            name="map"
            value="openfreemap"
            defaultChecked
            className="peer/openfreemap sr-only"
          />
          <div className="flex cursor-pointer items-center rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked/openfreemap:ring-2 peer-focus-visible/openfreemap:outline-2">
            Openfreemap
          </div>
        </label>
        <label className="min-w-fit flex-grow">
          <input
            type="radio"
            name="map"
            value="openstreetmap"
            className="peer/openstreetmap sr-only"
          />
          <div className="flex cursor-pointer items-center rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked/openstreetmap:ring-2 peer-focus-visible/openstreetmap:outline-2">
            Openstreetmap
          </div>
        </label>
      </div>
      <Map
        initialViewState={{
          longitude: -100,
          latitude: 40,
          zoom: 3.5,
        }}
        mapStyle={"https://tiles.openfreemap.org/styles/liberty"}
      >
        <ScaleControl />
        <NavigationControl />
      </Map>
    </main>
  );
}
export default App;
