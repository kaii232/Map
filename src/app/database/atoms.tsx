import { ALL_FILTERS } from "@/lib/filters";
import { BasemapNames, Range } from "@/lib/types";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";

/** Keeps track of which layers are visible */
export const layersAtom = atom({
  hillshade: false,
  plateMovementVectors: false,
  plates: false,
  platesNew: false,
  seafloorAge: false,
});

/** Keeps track of the currently selected basemap */
export const mapStyleAtom = atom<BasemapNames>("Openfreemap");
/** Keeps track of the drawings the user currently has on the map */
export const drawingAtom = atom<Polygon | MultiPolygon>();
/** Open state of the side panel */
export const panelOpenAtom = atom(true);

const defaultVisibility = () => {
  const defaultVal: Record<string, true> = {};
  Object.keys(ALL_FILTERS).forEach((val) => {
    defaultVal[val] = true;
  });
  return defaultVal;
};
/** Keeps track of which data types are visible */
export const dataVisibilityAtom =
  atom<Record<keyof typeof ALL_FILTERS, boolean>>(defaultVisibility());
/** Contains the geojson for each data type */
export const dataAtom = atom<
  Partial<Record<keyof typeof ALL_FILTERS, FeatureCollection>>
>({});

/** Contains the slip range of currently loaded slip data. Used for mapping the colour range to the slip range */
export const slipRangeAtom = atom<Range>([0, 0]);
