import { BasemapNames } from "@/lib/types";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";

export const layersAtom = atom({
  hillshade: false,
  plateMovementVectors: false,
  "tectonicPlates(Bird, 2003)": false,
  "tectonicPlaces(Hasterok, 2022)": false,
  // Put as the last one always
  seafloorAge: false,
});

export const mapStyleAtom = atom<BasemapNames>("Openfreemap");

export const drawingAtom = atom<Polygon | MultiPolygon>();

export const gnssDataAtom = atom<FeatureCollection>();
export const seisDataAtom = atom<FeatureCollection>();
export const smtDataAtom = atom<FeatureCollection>();
export const fltDataAtom = atom<FeatureCollection>();
export const vlcDataAtom = atom<FeatureCollection>();

export const dataVisibilityAtom = atom({
  gnss: true,
  seis: true,
  smt: true,
  flt: true,
  vlc: true,
});
