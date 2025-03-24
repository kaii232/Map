import { BasemapNames, DataKeys } from "@/lib/types";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";

export const layersAtom = atom({
  hillshade: false,
  plateMovementVectors: false,
  "tectonicPlates(Bird, 2003)": false,
  "tectonicPlaces(Hasterok, 2022)": false,
  seafloorAge: false,
});

export const mapStyleAtom = atom<BasemapNames>("Openfreemap");

export const drawingAtom = atom<Polygon | MultiPolygon>();

export const dataVisibilityAtom = atom<Record<DataKeys, boolean>>({
  gnss: true,
  seis: true,
  smt: true,
  flt: true,
  vlc: true,
  hf: true,
});

export const dataAtom = atom<Partial<Record<DataKeys, FeatureCollection>>>({});
