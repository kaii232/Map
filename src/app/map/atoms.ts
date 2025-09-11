import { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import type { Range } from "@/lib/filters";
import { BasemapNames } from "@/lib/types";
import { LoaderFilter } from "@/server/actions";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";

/** Keeps track of which layers are visible */
export const layersAtom = atom({
  hillshade: false,
  plateMovementVectors: false,
  plates: false,
  platesNew: false,
  seafloorAge: false,
  crustThickness: false,
});

/** Keeps track of the currently selected basemap */
export const mapStyleAtom = atom<BasemapNames>("Openfreemap");
/** Keeps track of the drawings the user currently has on the map */
export const drawingAtom = atom<Polygon | MultiPolygon>();
/** Open state of the side panel */
export const panelOpenAtom = atom(true);

// "points" | "vectors" | "both" (use a plain string; no custom type)
export const gnssModeAtom = atom("both");

// UI-only selection that hasn’t been applied yet
export const gnssModeDraftAtom = atom<string | null>(null);

export const gnssIconsVisibleAtom = atom((get) => {
  const m = get(gnssModeAtom);
  return m === "points" || m === "both";
});
export const gnssVectorsVisibleAtom = atom((get) => {
  const m = get(gnssModeAtom);
  return m === "vectors" || m === "both";
});

export const defaultVisibility = () => {
  const defaultVal: Record<string, true> = {};
  Object.keys(ALL_FILTERS_CLIENT).forEach((val) => {
    defaultVal[val] = true;
  });
  return defaultVal;
};
/** Keeps track of which data types are visible */
export const dataVisibilityAtom =
  atom<Record<keyof typeof ALL_FILTERS_CLIENT, boolean>>(defaultVisibility());
/** Contains the geojson for each data type */
export const dataAtom = atom<
  Partial<
    Record<
      keyof typeof ALL_FILTERS_CLIENT,
      {
        geojson: FeatureCollection;
        units?: Record<string, string>;
        params: LoaderFilter;
      }
    >
  >
>({});

/** Contains the range of currently loaded data. Used for mapping the colour range to the data range */
export const rangeAtom = atom<
  Partial<Record<keyof typeof ALL_FILTERS_CLIENT, Range>>
>({});

export const colorsAtom = atom({
  flt: "#f43f5e",
  gnss: { icon: "#E39F40", vector: "#8b36d1" },
  hf: ["#0c4a6e", "#0284c7", "#eeeeee", "#e11d48", "#4c0519"],
  seis: [
    "#fff7ec",
    "#fee8c8",
    "#fdd49e",
    "#fdbb84",
    "#eb7c49",
    "#db5235",
    "#b52112",
    "#750606",
    "#360A07",
    "#000000",
  ],
  slab2: [
    "#ffffa4",
    "#f6d543",
    "#fca309",
    "#f3761b",
    "#db503b",
    "#ba3655",
    "#922568",
    "#6a176e",
    "#400a67",
    "#150b37",
    "#000004",
  ],
  smt: "#854D0E",
  vlc: "#1E293B",
  slip: [
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
  ],
  rock: "#b85a1f",
} satisfies Record<
  keyof typeof ALL_FILTERS_CLIENT,
  string | string[] | Record<string, string | string[]>
>);
