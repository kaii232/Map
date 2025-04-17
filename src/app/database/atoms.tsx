import { ALL_FILTERS } from "@/lib/filters";
import { BasemapNames } from "@/lib/types";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";

export const layersAtom = atom({
  hillshade: false,
  plateMovementVectors: false,
  plates: false,
  platesNew: false,
  seafloorAge: false,
});

export const mapStyleAtom = atom<BasemapNames>("Openfreemap");

export const drawingAtom = atom<Polygon | MultiPolygon>();

const defaultVisibility = () => {
  const defaultVal: Record<string, true> = {};
  Object.keys(ALL_FILTERS).forEach((val) => {
    defaultVal[val] = true;
  });
  return defaultVal;
};
export const dataVisibilityAtom =
  atom<Record<keyof typeof ALL_FILTERS, boolean>>(defaultVisibility());

export const dataAtom = atom<
  Partial<Record<keyof typeof ALL_FILTERS, FeatureCollection>>
>({});
