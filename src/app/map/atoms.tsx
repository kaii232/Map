import { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import { Range } from "@/lib/filters";
import { BasemapNames } from "@/lib/types";
import { ActionReturn } from "@/server/actions";
import { MultiPolygon, Polygon } from "geojson";
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
      Extract<ActionReturn, { success: true }>["data"]
    >
  >
>({});

/** Contains the range of currently loaded data. Used for mapping the colour range to the data range */
export const rangeAtom = atom<
  Partial<Record<keyof typeof ALL_FILTERS_CLIENT, Range>>
>({});
